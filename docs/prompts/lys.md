## 2026-11-27

> 일단 c:\teamp-project_2\docs\git.md를 추가하였고 CLAUDE.md에 git관련 규칙이 어디에 있는지 명시했으나 현재 main은 배포용, 직접 push 금지, develop 브랜치는 개발 통합용으로 설정하고자 한다. develop내 브랜치 전략은 기존 {접두어}/{유형}/{기능명}으로 동일하며 develop으로 PR을 보낼 수 있도록하고 현재 branch가 github에서 PR 이후 merge된 다음 삭제하기로 했으나 develop과 main브랜치는 삭제되지 않도록 git.md를 수정해주고, 규칙 적용을 필요로하는 내용들을 보고후 허락을 맡은 후 반영하시오

> 일단은 그대로 놔두고 development branch만 생성되도록 해줘. 지금으로써는 PR 금지 규칙은 적용하지 말고 변경된 내역만 github repo에  반영되게 해줘

> 그렇다면 develop 보호 규칙을 적용해줘

> 현재 prettierrc.json을 설정했고, prettier-plugin-tailwindcss을 설치하여 후에 tailwindcss의 정렬이 적용되도록 설정해줘

> 일단 후에 c:\teamp-project_2\apps\web 경로에 NextJS와 tailwindcss를 설치할 예정이고, desktopapp의 css는 아직 지정되지 않았다. 이를 참고하여 path만 미리 설정하여 주고, format이라는 hook을 생성하여 claude code에 의한 코드 수정 및 작성시 Prettier/ESLint 자동 실행하도록 지정하여 주시오. 단, prettier는 prettierrc.json 규칙에 따라 적용하여 주시고, ESLint는 일반적인 규칙을 적용해주시오

> 일단 커밋만 진행해줘

> 세션 시작시 현재 브랜치, 나에게 할당된 이슈, main보다 뒤처졌는지 알려주는 훅을 생성해줘

> 일단 생각해보니 비개발자 직군에서 사용하기 복잡할 것 같으니 브랜치 전략에 있어서 단순하게  develop 브랜치는 삭제하고, main브랜치만 유지하되 작업공간에 있어서는 {접두어}/{유형}/{기능명} 유지하도록 해.

> 일단 커밋하고 main을 한 번 받아줘

> 일단 PR은 올려줘

> 날짜별로 오늘 한 일·막힌 곳·다음 할 일을 정리해 c:\teamp-project_2\docs\handoff 경로 내에 있는 자기 파일을 선택하여 기록하는 스킬을 만들어줘

> c:\teamp-project_2\.claude\skills\handoff, c:\teamp-project_2\.claude\skills\log, c:\teamp-project_2\.claude\skills\prompt, c:\teamp-project_2\.claude\skills\readme, 이 4가지 스킬을 하나로 합쳐서 한번만 입력하면 동작하도록 할 수 있나?

> 커밋하고 PR 올려줘

> /daily
