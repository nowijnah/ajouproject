// functions/index.js
const functions = require('firebase-functions');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors')({ origin: true });

// 기본 URL 설정
const BASE_URL = "https://softcon.ajou.ac.kr";

/**
 * 크롤링 프록시 함수
 * React 앱에서 호출해서 CORS 문제 없이 크롤링을 수행합니다
 */
exports.proxyCrawling = functions.https.onRequest((request, response) => {
  return cors(request, response, async () => {
    try {
      const { url } = request.query;
      
      if (!url) {
        return response.status(400).json({ error: 'URL 매개변수가 필요합니다.' });
      }

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://softcon.ajou.ac.kr/'
      };
      
      const result = await axios.get(url, {
        headers: headers,
        timeout: 10000
      });
      
      response.set('Content-Type', 'text/html; charset=utf-8');
      response.status(200).send(result.data);
    } catch (error) {
      functions.logger.error('크롤링 오류:', error);
      response.status(500).json({ error: error.message || '크롤링 중 오류가 발생했습니다.' });
    }
  });
});

/**
 * 프로젝트 링크 가져오기 함수
 */
exports.getProjectLinks = functions.https.onCall(async (data, context) => {
  try {
    const { listType = 'current', category = 'S', term = null } = data;
    
    let url;
    
    if (listType === "current") {
      url = `${BASE_URL}/works/works_list.asp?category=${category}`;
    } else {
      if (!term) {
        throw new Error("이전 작품 목록을 가져오려면 학기(term)가 필요합니다.");
      }
      url = `${BASE_URL}/works/works_list_prev.asp?category=${category}&wTerm=${term}`;
    }
    
    functions.logger.info(`목록 URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://softcon.ajou.ac.kr/'
      }
    });
    
    const $ = cheerio.load(response.data);
    const projects = [];
    
    // 모든 a 태그를 찾아서 작품 링크 추출
    $('a').each((index, element) => {
      const href = $(element).attr('href') || '';
      
      // 링크가 작품 상세 페이지인지 확인
      if ((href.includes('works.asp?uid=') || href.includes('works_prev.asp?uid=')) && !href.includes('javascript:')) {
        const title = $(element).text().trim();
        
        // 상대 경로를 절대 경로로 변환
        let fullUrl = href;
        if (href.startsWith('./') || href.startsWith('/')) {
          fullUrl = BASE_URL + href.replace('./', '/');
        } else if (!href.startsWith('http')) {
          fullUrl = BASE_URL + '/' + href;
        }
        
        // UID 및 학기 추출
        let uid = null;
        let termValue = null;
        
        if (fullUrl.includes('?uid=')) {
          uid = fullUrl.split('?uid=')[1].split('&')[0];
        }
        
        if (fullUrl.includes('wTerm=')) {
          const termPart = fullUrl.split('wTerm=')[1];
          termValue = termPart.includes('&') ? termPart.split('&')[0] : termPart;
        }
        
        // 중복 제거를 위한 확인
        const existingUrls = projects.map(p => p.url);
        if (!existingUrls.includes(fullUrl)) {
          projects.push({
            title: title || "제목 없음",
            url: fullUrl,
            uid,
            term: termValue
          });
        }
      }
    });
    
    functions.logger.info(`${projects.length}개의 프로젝트 링크를 찾았습니다.`);
    return { success: true, projects };
  } catch (error) {
    functions.logger.error('링크 가져오기 오류:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 프로젝트 상세 정보 가져오기 함수
 */
exports.getProjectDetails = functions.https.onCall(async (data, context) => {
  try {
    const { projectUrl } = data;
    
    if (!projectUrl) {
      throw new Error("프로젝트 URL이 필요합니다.");
    }
    
    functions.logger.info(`크롤링 URL: ${projectUrl}`);
    
    const response = await axios.get(projectUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://softcon.ajou.ac.kr/'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // 기본 정보 추출
    const details = {
      url: projectUrl,
      uid: null,
      term: null
    };
    
    // UID 및 학기 추출
    if (projectUrl.includes('?uid=')) {
      details.uid = projectUrl.split('?uid=')[1].split('&')[0];
    }
    
    if (projectUrl.includes('wTerm=')) {
      const termPart = projectUrl.split('wTerm=')[1];
      details.term = termPart.includes('&') ? termPart.split('&')[0] : termPart;
    }
    
    // 제목 추출
    const titleElem = $('.dw_title div p');
    if (titleElem.length) {
      details.title = titleElem.text().trim();
    }
    
    // 작품개요 추출
    const summaryElems = $('.work_detail div');
    if (summaryElems.length >= 2) {
      details.summary = $(summaryElems[1]).text().trim();
    }
    
    // 팀 정보 추출 (등록자, 팀원, 멘토)
    const teamInfo = {};
    
    // 등록자 정보
    const registrantSection = $('.dw_resistrant .dw_wrap:nth-of-type(1)');
    if (registrantSection.length) {
      const registrant = {};
      
      const departmentElem = registrantSection.find('.dw3 p');
      if (departmentElem.length) {
        registrant.department = departmentElem.text().trim();
      }
      
      const gradeElem = registrantSection.find('.dw4 p');
      if (gradeElem.length) {
        registrant.grade = gradeElem.text().trim();
      }
      
      const emailElem = registrantSection.find('.dw5 p');
      if (emailElem.length) {
        registrant.email = emailElem.text().trim();
      }
      
      teamInfo.registrant = registrant;
    }
    
    // 팀원 정보
    const membersSection = $('.dw_resistrant .dw_wrap:nth-of-type(2)');
    if (membersSection.length) {
      const members = [];
      
      membersSection.find('ul').each((index, element) => {
        const member = {};
        
        const roleElem = $(element).find('.dw1 span');
        if (roleElem.length) {
          member.role = roleElem.text().trim();
        }
        
        const nameElem = $(element).find('.dw2');
        if (nameElem.length) {
          member.name = nameElem.text().trim();
        }
        
        const deptElem = $(element).find('.dw3');
        if (deptElem.length) {
          member.department = deptElem.text().trim();
        }
        
        const gradeElem = $(element).find('.dw4');
        if (gradeElem.length) {
          member.grade = gradeElem.text().trim();
        }
        
        const emailElem = $(element).find('.dw5');
        if (emailElem.length) {
          member.email = emailElem.text().trim();
        }
        
        if (Object.keys(member).length) {
          members.push(member);
        }
      });
      
      teamInfo.members = members;
    }
    
    // 멘토 정보
    const mentorSection = $('.dw_resistrant .dw_wrap:nth-of-type(3)');
    if (mentorSection.length) {
      const mentor = {};
      
      const nameElem = mentorSection.find('.dw2');
      if (nameElem.length) {
        mentor.name = nameElem.text().trim();
      }
      
      const affiliationElem = mentorSection.find('.dw3');
      if (affiliationElem.length) {
        mentor.affiliation = affiliationElem.text().trim();
      }
      
      if (Object.keys(mentor).length) {
        teamInfo.mentor = mentor;
      }
    }
    
    details.teamInfo = teamInfo;
    
    // Git 저장소 정보
    const gitSection = $('.dw_resistrant .dw_wrap:nth-of-type(4)');
    if (gitSection.length) {
      const gitLinkElem = gitSection.find('.dw5 a');
      if (gitLinkElem.length) {
        details.gitRepository = gitLinkElem.attr('href')?.trim();
      }
    }
    
    // 간략설명 정보
    const descriptionSection = $('.dw_resistrant .dw_wrap:nth-of-type(5)');
    if (descriptionSection.length) {
      const descElem = descriptionSection.find('.dw5');
      if (descElem.length) {
        details.description = descElem.text().trim();
      }
    }
    
    // 발표자료 링크
    const presentationIframe = $('#pdfArea');
    if (presentationIframe.length) {
      details.presentationUrl = BASE_URL + presentationIframe.attr('src')?.trim();
    }
    
    // 발표 동영상 링크
    const videoIframe = $('.dw_video iframe');
    if (videoIframe.length) {
      details.videoUrl = videoIframe.attr('src')?.trim();
    }
    
    // 이미지 추출 (대표 이미지)
    const repImage = $('.dw_title div img');
    if (repImage.length && repImage.attr('src')) {
      let imgSrc = repImage.attr('src');
      if (imgSrc.startsWith('./') || imgSrc.startsWith('/')) {
        imgSrc = BASE_URL + imgSrc.replace('./', '/');
      }
      details.representativeImage = imgSrc;
    }
    
    return { success: true, details };
  } catch (error) {
    functions.logger.error(`상세 정보 가져오기 오류 (${data.projectUrl}): ${error.message}`);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 다중 프로젝트 정보 가져오기 (대량 작업용)
 */
// 새 버전에 맞게 수정
const { onCall } = require('firebase-functions/v2/https');

exports.getMultipleProjectDetails = onCall(
  {
    timeoutSeconds: 540,
    memory: '1GB'
  },
  async (data, context) => {
    try {
      const { projectUrls, delayMs = 1000 } = data;
      
      if (!projectUrls || !Array.isArray(projectUrls) || projectUrls.length === 0) {
        throw new Error("프로젝트 URL 배열이 필요합니다.");
      }
      
      functions.logger.info(`${projectUrls.length}개의 프로젝트 정보를 가져옵니다.`);
      
      const results = [];
      
      for (let i = 0; i < projectUrls.length; i++) {
        try {
          const url = projectUrls[i];
          functions.logger.info(`프로젝트 ${i+1}/${projectUrls.length} 처리 중: ${url}`);
          
          // 상세 정보 가져오기 로직
          const response = await axios.get(url, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Referer': 'https://softcon.ajou.ac.kr/'
            }
          });
          
          const $ = cheerio.load(response.data);
          
          // 기본 정보 추출
          const details = {
            url,
            uid: null,
            term: null
          };
          
          // UID 및 학기 추출
          if (url.includes('?uid=')) {
            details.uid = url.split('?uid=')[1].split('&')[0];
          }
          
          if (url.includes('wTerm=')) {
            const termPart = url.split('wTerm=')[1];
            details.term = termPart.includes('&') ? termPart.split('&')[0] : termPart;
          }
          
          // 제목 추출
          const titleElem = $('.dw_title div p');
          if (titleElem.length) {
            details.title = titleElem.text().trim();
          }
          
          // 작품개요 추출
          const summaryElems = $('.work_detail div');
          if (summaryElems.length >= 2) {
            details.summary = $(summaryElems[1]).text().trim();
          }
          
          // 팀 정보 추출 (등록자, 팀원, 멘토)
          const teamInfo = {};
          
          // 등록자 정보
          const registrantSection = $('.dw_resistrant .dw_wrap:nth-of-type(1)');
          if (registrantSection.length) {
            const registrant = {};
            
            const departmentElem = registrantSection.find('.dw3 p');
            if (departmentElem.length) {
              registrant.department = departmentElem.text().trim();
            }
            
            const gradeElem = registrantSection.find('.dw4 p');
            if (gradeElem.length) {
              registrant.grade = gradeElem.text().trim();
            }
            
            const emailElem = registrantSection.find('.dw5 p');
            if (emailElem.length) {
              registrant.email = emailElem.text().trim();
            }
            
            teamInfo.registrant = registrant;
          }
          
          // 팀원 정보
          const membersSection = $('.dw_resistrant .dw_wrap:nth-of-type(2)');
          if (membersSection.length) {
            const members = [];
            
            membersSection.find('ul').each((index, element) => {
              const member = {};
              
              const roleElem = $(element).find('.dw1 span');
              if (roleElem.length) {
                member.role = roleElem.text().trim();
              }
              
              const nameElem = $(element).find('.dw2');
              if (nameElem.length) {
                member.name = nameElem.text().trim();
              }
              
              const deptElem = $(element).find('.dw3');
              if (deptElem.length) {
                member.department = deptElem.text().trim();
              }
              
              const gradeElem = $(element).find('.dw4');
              if (gradeElem.length) {
                member.grade = gradeElem.text().trim();
              }
              
              const emailElem = $(element).find('.dw5');
              if (emailElem.length) {
                member.email = emailElem.text().trim();
              }
              
              if (Object.keys(member).length) {
                members.push(member);
              }
            });
            
            teamInfo.members = members;
          }
          
          // 멘토 정보
          const mentorSection = $('.dw_resistrant .dw_wrap:nth-of-type(3)');
          if (mentorSection.length) {
            const mentor = {};
            
            const nameElem = mentorSection.find('.dw2');
            if (nameElem.length) {
              mentor.name = nameElem.text().trim();
            }
            
            const affiliationElem = mentorSection.find('.dw3');
            if (affiliationElem.length) {
              mentor.affiliation = affiliationElem.text().trim();
            }
            
            if (Object.keys(mentor).length) {
              teamInfo.mentor = mentor;
            }
          }
          
          details.teamInfo = teamInfo;
          
          // Git 저장소 정보
          const gitSection = $('.dw_resistrant .dw_wrap:nth-of-type(4)');
          if (gitSection.length) {
            const gitLinkElem = gitSection.find('.dw5 a');
            if (gitLinkElem.length) {
              details.gitRepository = gitLinkElem.attr('href')?.trim();
            }
          }
          
          // 간략설명 정보
          const descriptionSection = $('.dw_resistrant .dw_wrap:nth-of-type(5)');
          if (descriptionSection.length) {
            const descElem = descriptionSection.find('.dw5');
            if (descElem.length) {
              details.description = descElem.text().trim();
            }
          }
          
          // 발표자료 링크
          const presentationIframe = $('#pdfArea');
          if (presentationIframe.length) {
            details.presentationUrl = BASE_URL + presentationIframe.attr('src')?.trim();
          }
          
          // 발표 동영상 링크
          const videoIframe = $('.dw_video iframe');
          if (videoIframe.length) {
            details.videoUrl = videoIframe.attr('src')?.trim();
          }
          
          // 이미지 추출 (대표 이미지)
          const repImage = $('.dw_title div img');
          if (repImage.length && repImage.attr('src')) {
            let imgSrc = repImage.attr('src');
            if (imgSrc.startsWith('./') || imgSrc.startsWith('/')) {
              imgSrc = BASE_URL + imgSrc.replace('./', '/');
            }
            details.representativeImage = imgSrc;
          }
          
          results.push(details);
          
          // 서버 부하 방지를 위한 지연
          if (i < projectUrls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        } catch (error) {
          functions.logger.error(`URL 처리 오류 (${projectUrls[i]}): ${error.message}`);
          results.push({
            url: projectUrls[i],
            error: error.message
          });
        }
      }
      
      return { success: true, results };
    } catch (error) {
      functions.logger.error('다중 프로젝트 정보 가져오기 오류:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });