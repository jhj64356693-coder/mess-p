// QuestionGenerator.js
export const generatePrompt = (count, topic) => {
    // 1. 난이도 전략 (10개 미만일 때 더 정교하게 분산)
    const getDifficulty = (index) => {
      if (count < 10) {
        const levels = ['입문', '기초', '임상응용']; // 난이도를 명칭으로 구체화
        return levels[Math.floor(Math.random() * levels.length)];
      }
      // 10개 이상일 때는 국가고시 비중(상중하)에 맞게 배분
      if (index < count * 0.2) return '고난도';
      if (index < count * 0.7) return '중간';
      return '기초';
    };
  
    // 2. 다양성 확보를 위한 시나리오 시드 (1~3개 생성 시 필수)
    const medicalCases = ['외상', '심혈관', '호흡기', '소아응급', '산과', '환경응급'];
    const selectedCase = medicalCases[Math.floor(Math.random() * medicalCases.length)];
  
    // 3. 최종 프롬프트 구성 (사용자 입력 문항 수 엄격 준수)
    return `
      너는 1급 응급구조사 국가고시 출제위원이야. 
      다음 조건으로 딱 ${count}개의 문제만 생성해. (절대 230개를 만들지 마라)
      
      주제: ${topic}
      주요 케이스: ${count <= 3 ? selectedCase : '다양한 응급 상황'}
      
      [출제 규칙]
      1. 각 문항의 난이도를 무작위로 섞되, 특히 ${getDifficulty(0)} 수준의 문제를 포함할 것.
      2. 1~3문항 생성 시, 단순 인적 사항만 바꾸지 말고 질병의 기전(Mechanism)이나 현장 상황을 완전히 다르게 설정할 것.
      3. 문제 형식: 선다형 (5지 선다).
      4. 출력 형식: JSON (id, question, options, answer, explanation).
    `;
  };