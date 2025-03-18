import requests
from bs4 import BeautifulSoup
import json
import os
import time

# 기본 URL 및 경로 설정
BASE_URL = "https://softcon.ajou.ac.kr"

def get_project_links(list_type="current", category="S", term=None):
    """목록 페이지에서 프로젝트 링크 추출"""
    if list_type == "current":
        # 현재 작품 목록
        url = f"{BASE_URL}/works/works_list.asp?category={category}"
    else:
        # 이전 작품 목록 (학기 필수)
        if not term:
            raise ValueError("이전 작품 목록을 가져오려면 학기(term)가 필요합니다.")
        url = f"{BASE_URL}/works/works_list_prev.asp?category={category}&wTerm={term}"
    
    print(f"목록 URL: {url}")
    
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    projects = []
    
    # 모든 a 태그를 찾아서 작품 링크 추출
    for link in soup.select('a'):
        href = link.get('href', '')
        
        # 링크가 작품 상세 페이지인지 확인
        if ('works.asp?uid=' in href or 'works_prev.asp?uid=' in href) and 'javascript:' not in href:
            title = link.text.strip()
            
            # 상대 경로를 절대 경로로 변환
            full_url = href
            if href.startswith('./') or href.startswith('/'):
                full_url = BASE_URL + href.replace('./', '/')
            elif not href.startswith('http'):
                full_url = BASE_URL + '/' + href
                
            # UID 및 학기 추출
            uid = None
            term_value = None
            
            if '?uid=' in full_url:
                uid = full_url.split('?uid=')[1].split('&')[0]
            if 'wTerm=' in full_url:
                term_value = full_url.split('wTerm=')[1].split('&')[0] if '&' in full_url.split('wTerm=')[1] else full_url.split('wTerm=')[1]
            
            # 중복 제거를 위한 확인
            existing_urls = [p['url'] for p in projects]
            if full_url not in existing_urls:
                projects.append({
                    'title': title if title else "제목 없음",
                    'url': full_url,
                    'uid': uid,
                    'term': term_value
                })
    
    print(f"{len(projects)}개의 프로젝트 링크를 찾았습니다.")
    return projects

def get_project_details(project_url):
    """프로젝트 상세 페이지에서 정보 추출"""
    try:
        print(f"크롤링 URL: {project_url}")
        response = requests.get(project_url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 기본 정보 추출
        details = {
            'url': project_url,
            'uid': None,
            'term': None
        }
        
        # UID 및 학기 추출
        if '?uid=' in project_url:
            details['uid'] = project_url.split('?uid=')[1].split('&')[0]
        if 'wTerm=' in project_url:
            details['term'] = project_url.split('wTerm=')[1].split('&')[0] if '&' in project_url.split('wTerm=')[1] else project_url.split('wTerm=')[1]
        
        # 제목 추출
        title_elem = soup.select_one('.dw_title div p')
        if title_elem:
            details['title'] = title_elem.text.strip()
        
        # 작품개요 추출
        summary_elem = soup.select('.work_detail div')
        if len(summary_elem) >= 2:
            details['summary'] = summary_elem[1].text.strip()
        
        # 팀 정보 추출 (등록자, 팀원, 멘토)
        team_info = {}
        
        # 등록자 정보
        registrant_section = soup.select_one('.dw_resistrant .dw_wrap:nth-of-type(1)')
        if registrant_section:
            registrant = {}
            department_elem = registrant_section.select_one('.dw3 p')
            if department_elem:
                registrant['department'] = department_elem.text.strip()
            
            grade_elem = registrant_section.select_one('.dw4 p')
            if grade_elem:
                registrant['grade'] = grade_elem.text.strip()
            
            email_elem = registrant_section.select_one('.dw5 p')
            if email_elem:
                registrant['email'] = email_elem.text.strip()
            
            team_info['registrant'] = registrant
        
        # 팀원 정보
        members_section = soup.select_one('.dw_resistrant .dw_wrap:nth-of-type(2)')
        if members_section:
            members = []
            for member_row in members_section.select('ul'):
                member = {}
                
                role_elem = member_row.select_one('.dw1 span')
                if role_elem:
                    member['role'] = role_elem.text.strip()
                
                name_elem = member_row.select_one('.dw2')
                if name_elem:
                    member['name'] = name_elem.text.strip()
                
                dept_elem = member_row.select_one('.dw3')
                if dept_elem:
                    member['department'] = dept_elem.text.strip()
                
                grade_elem = member_row.select_one('.dw4')
                if grade_elem:
                    member['grade'] = grade_elem.text.strip()
                
                email_elem = member_row.select_one('.dw5')
                if email_elem:
                    member['email'] = email_elem.text.strip()
                
                if member:
                    members.append(member)
            
            team_info['members'] = members
        
        # 멘토 정보
        mentor_section = soup.select_one('.dw_resistrant .dw_wrap:nth-of-type(3)')
        if mentor_section:
            mentor = {}
            
            name_elem = mentor_section.select_one('.dw2')
            if name_elem:
                mentor['name'] = name_elem.text.strip()
            
            affiliation_elem = mentor_section.select_one('.dw3')
            if affiliation_elem:
                mentor['affiliation'] = affiliation_elem.text.strip()
            
            if mentor:
                team_info['mentor'] = mentor
        
        details['teamInfo'] = team_info
        
        # Git 저장소 정보
        git_section = soup.select_one('.dw_resistrant .dw_wrap:nth-of-type(4)')
        if git_section:
            git_link_elem = git_section.select_one('.dw5 a')
            if git_link_elem:
                details['gitRepository'] = git_link_elem.get('href', '').strip()
        
        # 간략설명 정보
        description_section = soup.select_one('.dw_resistrant .dw_wrap:nth-of-type(5)')
        if description_section:
            desc_elem = description_section.select_one('.dw5')
            if desc_elem:
                details['description'] = desc_elem.text.strip()
        
        # 발표자료 링크
        presentation_iframe = soup.select_one('#pdfArea')
        if presentation_iframe:
            details['presentationUrl'] = BASE_URL + presentation_iframe.get('src', '').strip()
        
        # 발표 동영상 링크
        video_iframe = soup.select_one('.dw_video iframe')
        if video_iframe:
            details['videoUrl'] = video_iframe.get('src', '').strip()
        
        # 이미지 추출 (대표 이미지)
        rep_image = soup.select_one('.dw_title div img')
        if rep_image and rep_image.has_attr('src'):
            img_src = rep_image['src']
            if img_src.startswith('./') or img_src.startswith('/'):
                img_src = BASE_URL + img_src.replace('./', '/')
            details['representativeImage'] = img_src
        
        # 좋아요 및 댓글 수
        like_count_elem = soup.select_one('#likeCnt')
        if like_count_elem:
            details['likeCount'] = like_count_elem.text.strip()
        
        comment_count_elem = soup.select_one('#commentCnt')
        if comment_count_elem:
            details['commentCount'] = comment_count_elem.text.strip()
        
        return details
    
    except Exception as e:
        print(f"오류 발생 ({project_url}): {str(e)}")
        return {
            'url': project_url,
            'error': str(e)
        }

def main():
    """메인 함수"""
    # 결과 저장 폴더 생성
    os.makedirs("softcon_data", exist_ok=True)
    
    # 모드 선택
    print("소프트콘 작품 크롤러")
    print("1. 현재 작품 목록")
    print("2. 이전 작품 목록 (학기별)")
    mode = input("선택 (1 또는 2): ")
    
    # 공통 설정
    category = input("카테고리를 입력하세요 (S: 소프트웨어, D: 디지털미디어, C: 사이버보안, I: 인공지능융합) (기본값: S): ") or "S"
    max_projects = int(input("최대 프로젝트 수를 입력하세요 (기본값: 50): ") or "50")
    
    if mode == "1":
        # 현재 작품 목록
        projects = get_project_links("current", category)
    else:
        # 이전 작품 목록
        term = input("학기를 입력하세요 (예: 2024-1) (기본값: 2024-1): ") or "2024-1"
        projects = get_project_links("previous", category, term)
    
    # 링크가 없으면 종료
    if not projects:
        print("프로젝트 링크를 찾을 수 없습니다. 크롤링을 종료합니다.")
        return
    
    # 링크 저장
    with open("softcon_data/project_links.json", "w", encoding="utf-8") as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)
    
    # 2. 상세 정보 가져오기 (최대 갯수 제한)
    limited_projects = projects[:min(len(projects), max_projects)]
    project_details = []
    
    for i, project in enumerate(limited_projects):
        print(f"프로젝트 {i+1}/{len(limited_projects)} 처리 중...")
        details = get_project_details(project['url'])
        project_details.append(details)
        
        # 서버 부하 방지를 위한 지연
        if i < len(limited_projects) - 1:
            time.sleep(1)
    
    # 상세 정보 저장
    with open("softcon_data/project_details.json", "w", encoding="utf-8") as f:
        json.dump(project_details, f, ensure_ascii=False, indent=2)
    
    print("\n크롤링 완료!")
    print(f"- 링크 데이터: softcon_data/project_links.json ({len(projects)}개)")
    print(f"- 상세 데이터: softcon_data/project_details.json ({len(project_details)}개)")

if __name__ == "__main__":
    main()