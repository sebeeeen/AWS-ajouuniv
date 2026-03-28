import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const typeSeeds = [
    {
      key: "quantitative-reasoning",
      name: "수리 추리",
      description: "빠른 연산, 비율, 수열 규칙을 처리하는 영역",
      sectionOrder: 1,
      defaultTimeSeconds: 45
    },
    {
      key: "verbal-reasoning",
      name: "언어 추리",
      description: "추론, 조건 해석, 문장 관계 판단 영역",
      sectionOrder: 2,
      defaultTimeSeconds: 45
    },
    {
      key: "data-interpretation",
      name: "자료 해석",
      description: "표와 그래프를 빠르게 읽고 비교하는 영역",
      sectionOrder: 3,
      defaultTimeSeconds: 50
    }
  ];

  const typeMap = new Map<string, string>();

  for (const typeSeed of typeSeeds) {
    const type = await prisma.questionType.upsert({
      where: { key: typeSeed.key },
      update: typeSeed,
      create: typeSeed
    });
    typeMap.set(type.key, type.id);
  }

  const questionSeeds = [
    {
      code: "QR-001",
      typeKey: "quantitative-reasoning",
      prompt:
        "한 직원이 동일한 검토표 3장을 12분에 처리한다. 같은 속도라면 50분 동안 몇 장을 완료할 수 있는가?",
      explanation:
        "12분에 3장이므로 4분에 1장이다. 50분이면 12장을 완료하고 2분이 남으므로 완료한 장수는 12장이다.",
      fastStrategy:
        "바로 단위 시간으로 바꾸는 것이 가장 빠르다. 12분에 3장이라면 곧바로 4분에 1장으로 정리하면 된다.",
      commonTrap:
        "50×3÷12만 계산하고 끝내면 완전히 끝난 장수인지 확인을 놓칠 수 있다.",
      takeaway: "작업량 문제는 먼저 1개당 걸리는 시간으로 바꾸면 훨씬 빨라진다.",
      difficulty: 2,
      tags: ["속도", "작업량"],
      choices: [
        ["A", "10"],
        ["B", "11"],
        ["C", "12"],
        ["D", "13"],
        ["E", "15"]
      ],
      correct: "C"
    },
    {
      code: "QR-002",
      typeKey: "quantitative-reasoning",
      prompt:
        "빨간 파일, 파란 파일, 초록 파일의 비가 3:5:2이다. 빨간 파일이 18개라면 파란 파일과 초록 파일의 합은 몇 개인가?",
      explanation:
        "3칸이 18개이므로 1칸은 6개다. 파란색과 초록색은 합쳐서 7칸이므로 42개다.",
      fastStrategy:
        "주어진 색 하나로 1칸 값을 만든 뒤, 필요한 칸 수를 한 번에 곱하면 된다.",
      commonTrap:
        "파란색과 초록색을 따로 구하면 시간이 더 걸리고 계산 실수 위험이 커진다.",
      takeaway: "비율 문제는 1칸 값을 만든 뒤 목표 칸 수로 바로 가는 습관이 중요하다.",
      difficulty: 1,
      tags: ["비율"],
      choices: [
        ["A", "30"],
        ["B", "36"],
        ["C", "40"],
        ["D", "42"],
        ["E", "48"]
      ],
      correct: "D"
    },
    {
      code: "QR-003",
      typeKey: "quantitative-reasoning",
      prompt:
        "어떤 수열은 이전 항에 그 항의 각 자리 숫자 합을 더해 다음 항을 만든다. 첫째 항이 14일 때 셋째 항은 무엇인가?",
      explanation:
        "14에서 1+4를 더하면 19, 다시 19에서 1+9를 더하면 29이므로 셋째 항은 29이다.",
      fastStrategy:
        "필요한 단계만 직접 계산하는 것이 가장 빠르다. 항이 몇 개 안 되면 복잡한 규칙을 찾지 않아도 된다.",
      commonTrap:
        "짧은 재귀 수열인데도 일반항을 찾으려 하면 시간만 낭비한다.",
      takeaway: "짧은 수열은 패턴 추정보다 직접 전개가 더 빠른 경우가 많다.",
      difficulty: 2,
      tags: ["수열"],
      choices: [
        ["A", "24"],
        ["B", "27"],
        ["C", "28"],
        ["D", "29"],
        ["E", "31"]
      ],
      correct: "D"
    },
    {
      code: "VR-001",
      typeKey: "verbal-reasoning",
      prompt:
        "다음 문장에서 가장 적절하게 도출되는 결론을 고르시오. '효율적인 팀은 모두 자신의 실수를 빠르게 검토한다. 그리고 일부 제품팀은 효율적인 팀이다.'",
      explanation:
        "일부 제품팀이 효율적인 팀이고, 효율적인 팀은 모두 실수를 빠르게 검토하므로 일부 제품팀은 실수를 빠르게 검토한다고 볼 수 있다.",
      fastStrategy:
        "문장을 다시 읽기보다 집합 포함 관계로 바꿔서 보면 훨씬 빠르다.",
      commonTrap:
        "'일부'를 '모두'로 바꿔 읽으면 과도하게 넓은 결론을 고르게 된다.",
      takeaway: "언어 추리는 선지 보기 전에 집합 관계로 정리하면 속도가 빨라진다.",
      difficulty: 2,
      tags: ["논리", "추론"],
      choices: [
        ["A", "모든 제품팀은 실수를 빠르게 검토한다."],
        ["B", "일부 제품팀은 실수를 빠르게 검토한다."],
        ["C", "실수를 빠르게 검토하는 팀은 제품팀뿐이다."],
        ["D", "효율적인 팀 중 제품팀은 없다."],
        ["E", "일부 제품팀은 효율적인 팀이 아니다."]
      ],
      correct: "B"
    },
    {
      code: "VR-002",
      typeKey: "verbal-reasoning",
      prompt:
        "다음 유추를 가장 적절하게 완성하는 것은? '필터 : 물 = 편집자 : ____'",
      explanation:
        "필터는 물에서 불순물을 걸러내고, 편집자는 글에서 오류와 흠을 다듬는다. 가장 가까운 대상은 원고다.",
      fastStrategy:
        "먼저 기능 관계를 본다. 도구가 어떤 대상을 더 나은 상태로 만든다는 구조를 잡으면 된다.",
      commonTrap:
        "저자처럼 '만드는 사람'을 고르면, 실제로 다듬어지는 대상과 혼동하게 된다.",
      takeaway: "유추 문제는 보기 전에 두 단어 사이의 작용 관계를 먼저 정리하는 것이 빠르다.",
      difficulty: 1,
      tags: ["유추"],
      choices: [
        ["A", "저자"],
        ["B", "인쇄기"],
        ["C", "원고"],
        ["D", "도서관"],
        ["E", "독자"]
      ],
      correct: "C"
    },
    {
      code: "VR-003",
      typeKey: "verbal-reasoning",
      prompt:
        "안내문에 '정오 전에 제출한 지원서는 서류가 불완전하지 않은 한 오늘 처리된다'고 적혀 있다. 가장 정확한 설명은 무엇인가?",
      explanation:
        "정오 전에 제출하는 것만으로는 충분하지 않다. 오늘 처리되려면 서류도 완전해야 한다.",
      fastStrategy:
        "'~하지 않은 한'과 같은 예외 표현을 먼저 잡아야 보장 조건을 정확히 읽을 수 있다.",
      commonTrap:
        "예외 문구를 무시하면 정오 전 제출은 모두 오늘 처리된다고 잘못 해석하기 쉽다.",
      takeaway: "조건 문제는 예외 조건부터 체크한 뒤 결론 선지를 판단해야 한다.",
      difficulty: 2,
      tags: ["조건"],
      choices: [
        ["A", "정오 전에 제출한 모든 지원서는 오늘 처리된다."],
        ["B", "정오 이후에 제출한 지원서는 오늘 절대 처리되지 않는다."],
        ["C", "정오 전에 제출했고 서류가 완전한 지원서는 오늘 처리된다."],
        ["D", "서류가 불완전해도 정오 전에 제출하면 오늘 처리된다."],
        ["E", "서류가 완전한 지원서는 언제나 오늘 처리된다."]
      ],
      correct: "C"
    },
    {
      code: "DI-001",
      typeKey: "data-interpretation",
      passage:
        "팀별 월간 학습 시간: A팀 18시간, B팀 24시간, C팀 30시간, D팀 28시간",
      prompt:
        "C팀의 학습 시간은 A팀과 B팀 평균보다 몇 시간 더 많은가?",
      explanation:
        "A팀과 B팀의 평균은 (18+24)/2=21시간이다. C팀은 30시간이므로 9시간 더 많다.",
      fastStrategy:
        "비교 대상 두 팀의 평균을 먼저 만든 뒤 한 번만 비교하면 된다.",
      commonTrap:
        "합계와 평균을 혼동하면 비교 기준이 완전히 달라진다.",
      takeaway: "문제에서 평균이라고 하면 어떤 비교보다 먼저 평균값부터 만들어야 한다.",
      difficulty: 1,
      tags: ["표", "평균"],
      choices: [
        ["A", "6"],
        ["B", "7"],
        ["C", "8"],
        ["D", "9"],
        ["E", "10"]
      ],
      correct: "D"
    },
    {
      code: "DI-002",
      typeKey: "data-interpretation",
      passage:
        "분기별 매출 지수: 1분기 80, 2분기 96, 3분기 120, 4분기 108",
      prompt:
        "연속된 두 분기 사이에서 증가율이 가장 큰 구간은 어디인가?",
      explanation:
        "1분기에서 2분기는 80에서 16 증가해 20% 증가다. 2분기에서 3분기는 96에서 24 증가해 25% 증가다. 3분기에서 4분기는 감소이므로 가장 큰 증가율은 2분기에서 3분기다.",
      fastStrategy:
        "증가율은 증가량 자체보다 시작값 대비 얼마나 늘었는지가 핵심이다.",
      commonTrap:
        "증가량만 보고 판단하면 기준값이 다른 문제에서 바로 틀리게 된다.",
      takeaway: "증가율 문제는 항상 증가량을 원래 값으로 나눠서 봐야 한다.",
      difficulty: 2,
      tags: ["증가율", "표"],
      choices: [
        ["A", "1분기 → 2분기"],
        ["B", "2분기 → 3분기"],
        ["C", "3분기 → 4분기"],
        ["D", "1분기 → 4분기"],
        ["E", "2분기 → 4분기"]
      ],
      correct: "B"
    },
    {
      code: "DI-003",
      typeKey: "data-interpretation",
      passage:
        "설문 결과: A 선택 40%, B 선택 35%, C 선택 15%, 나머지는 D 선택",
      prompt:
        "설문에 240명이 참여했다면 D를 선택한 사람은 몇 명인가?",
      explanation:
        "A, B, C를 합하면 90%이므로 D는 10%다. 240명의 10%는 24명이다.",
      fastStrategy:
        "주어진 비율을 개수로 모두 바꾸지 말고 100에서 빼서 남은 비율을 먼저 구하는 것이 빠르다.",
      commonTrap:
        "각 선택지를 모두 인원수로 바꾸면 불필요한 계산이 늘어난다.",
      takeaway: "나머지 항목 문제는 전체에서 빠진 비율을 먼저 찾는 습관이 중요하다.",
      difficulty: 1,
      tags: ["백분율", "설문"],
      choices: [
        ["A", "18"],
        ["B", "20"],
        ["C", "24"],
        ["D", "30"],
        ["E", "36"]
      ],
      correct: "C"
    }
  ];

  for (const questionSeed of questionSeeds) {
    const question = await prisma.question.upsert({
      where: { code: questionSeed.code },
      update: {
        typeId: typeMap.get(questionSeed.typeKey)!,
        prompt: questionSeed.prompt,
        passage: questionSeed.passage ?? null,
        explanation: questionSeed.explanation,
        fastStrategy: questionSeed.fastStrategy,
        commonTrap: questionSeed.commonTrap,
        takeaway: questionSeed.takeaway,
        difficulty: questionSeed.difficulty,
        tags: questionSeed.tags.join(",")
      },
      create: {
        code: questionSeed.code,
        typeId: typeMap.get(questionSeed.typeKey)!,
        prompt: questionSeed.prompt,
        passage: questionSeed.passage ?? null,
        explanation: questionSeed.explanation,
        fastStrategy: questionSeed.fastStrategy,
        commonTrap: questionSeed.commonTrap,
        takeaway: questionSeed.takeaway,
        difficulty: questionSeed.difficulty,
        tags: questionSeed.tags.join(",")
      }
    });

    for (const [index, [label, content]] of questionSeed.choices.entries()) {
      await prisma.answerChoice.upsert({
        where: {
          questionId_label: {
            questionId: question.id,
            label
          }
        },
        update: {
          content,
          orderIndex: index,
          isCorrect: label === questionSeed.correct
        },
        create: {
          questionId: question.id,
          label,
          content,
          orderIndex: index,
          isCorrect: label === questionSeed.correct
        }
      });
    }
  }

  console.log("문항 시드 데이터 입력 완료");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
