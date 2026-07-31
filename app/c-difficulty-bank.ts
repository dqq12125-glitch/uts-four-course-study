import type { InstructorQuestion } from "./instructor-question-bank";

const b = (zh: string, en: string) => ({ zh, en });

/**
 * Newly authored questions calibrated to the known 48430 assessment style.
 * They are not copied from, or represented as, unretrieved Canvas papers.
 */
const authoredCDifficultyQuestionBank: InstructorQuestion[] = [
  {
    id: "c-0-difficulty-01",
    courseId: "c",
    topicId: "c-0",
    kind: "data",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "multi-step-calculation",
    estimatedMinutes: 6,
    answerTools: ["code-draft"],
    question: b(
      "阅读代码。程序会输出什么？必须分别说明整数除法、余数和强制类型转换的作用。",
      "Trace the code. What does it print? Your reasoning must distinguish integer division, remainder and the explicit cast.",
    ),
    options: [b("2.1", "2.1"), b("2.3", "2.3"), b("2.4", "2.4"), b("3.0", "3.0")],
    answer: 0,
    visual: {
      kind: "code",
      title: b("待追踪程序", "Program to trace"),
      code: `#include <stdio.h>

int main(void) {
    int a = 7, d = 3;
    double r = (double)(a / d) + (a % d) / 10.0;
    printf("%.1f\\n", r);
    return 0;
}`,
    },
    explanation: b(
      "第 1 步｜先按括号确定求值顺序\n(a / d) 的两个操作数都是 int，因此先执行整数除法，而不是因为结果稍后转成 double 就改做浮点除法。\n\n第 2 步｜计算整数商\n7/3 的整数商为 2；外层 (double) 只把已经得到的 2 转成 2.0，丢掉的小数不会回来。\n\n第 3 步｜计算余数项\n7%3=1，而 10.0 是 double，所以 1/10.0 做浮点除法，结果为 0.1。\n\n第 4 步｜合并并按格式输出\nr=2.0+0.1=2.1；%.1f 保留一位小数，因此输出 2.1。\n\n第 5 步｜排除干扰项\n若写成 (double)a/d，第一项才会是 7.0/3；本题的转换在整数除法之后。故选 A。",
      "Step 1 | Respect the parentheses\nBoth operands of (a / d) are int, so integer division occurs first. A later conversion cannot retroactively make that division floating-point.\n\nStep 2 | Evaluate the quotient\n7/3 has integer quotient 2. The outer (double) converts that completed result to 2.0; discarded fractional information is not restored.\n\nStep 3 | Evaluate the remainder term\n7%3 is 1. Because 10.0 is double, 1/10.0 is floating-point division and equals 0.1.\n\nStep 4 | Combine and format\nr=2.0+0.1=2.1, and %.1f prints one digit after the decimal point.\n\nStep 5 | Reject the distractor\nOnly (double)a/d would convert before division. Here the cast is outside the integer quotient. Choose A.",
    ),
    rubric: {
      zh: ["1 分：识别整数除法", "1 分：说明转换发生在除法之后", "1 分：正确求余数项", "1 分：解释 %.1f", "1 分：答案 2.1"],
      en: ["1: identify integer division", "1: locate the cast after division", "1: evaluate the remainder term", "1: explain %.1f", "1: answer 2.1"],
    },
  },
  {
    id: "c-0-difficulty-02",
    courseId: "c",
    topicId: "c-0",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "error-analysis",
    cognitiveRole: "error-analysis",
    estimatedMinutes: 7,
    answerTools: ["code-draft"],
    question: b(
      "程序需要读取一个 0–130 的年龄；当前版本有严重错误。哪一个替换片段同时修复地址参数、输入失败检查和范围检查？",
      "The program must read an age from 0 to 130. Which replacement fixes the address argument, conversion-failure check and range check together?",
    ),
    options: [
      b('scanf("%d", age);', 'scanf("%d", age);'),
      b('if (scanf("%d", &age) != 1 || age < 0 || age > 130) return 1;', 'if (scanf("%d", &age) != 1 || age < 0 || age > 130) return 1;'),
      b('if (scanf("%d", age) == 1 && age <= 130) return 1;', 'if (scanf("%d", age) == 1 && age <= 130) return 1;'),
      b('scanf("%d", &age); if (age > 130) age = 130;', 'scanf("%d", &age); if (age > 130) age = 130;'),
    ],
    answer: 1,
    visual: {
      kind: "code",
      title: b("有缺陷的输入代码", "Faulty input code"),
      code: `int age;
scanf("%d", age);
printf("next year: %d\\n", age + 1);`,
    },
    explanation: b(
      "第 1 步｜检查 scanf 的参数契约\n%d 要把结果写入 int 对象，所以必须传 int*。age 是未初始化的值，&age 才是可写地址。\n\n第 2 步｜检查转换是否成功\nscanf 返回成功赋值的项目数。这里只有一个 %d，因此返回 1 才表示 age 已被写入；若失败就读取 age 会使用不确定值。\n\n第 3 步｜验证业务范围\n成功转换不代表数值合理，还要拒绝 age<0 或 age>130；两个边界 0 和 130 应保留。\n\n第 4 步｜比较选项\nB 先以 &age 读取，再用短路或连接失败与越界条件，三项要求都覆盖。D 没检查返回值且悄悄篡改输入。\n\n第 5 步｜结论\n选择 B。可靠输入处理的顺序是：正确地址 → 确认转换成功 → 验证范围 → 才使用变量。",
      "Step 1 | Check scanf's argument contract\n%d writes into an int object, so it requires int*. age is an uninitialised value; &age is the writable address.\n\nStep 2 | Check conversion success\nscanf returns the number of successful assignments. With one %d, only a return of 1 establishes that age was written. Using it after failure reads an indeterminate value.\n\nStep 3 | Validate the domain\nA successful conversion can still be outside the allowed domain. Reject age<0 and age>130 while retaining both endpoints.\n\nStep 4 | Compare the patches\nB supplies &age and combines failed conversion and invalid range with short-circuit OR. D neither checks the return value nor honestly rejects bad input.\n\nStep 5 | Conclude\nChoose B. Robust input follows: correct address → conversion success → range validation → use.",
    ),
    rubric: {
      zh: ["1 分：解释 &age", "1 分：解释 scanf 返回值", "1 分：检查下界", "1 分：检查上界", "1 分：说明短路求值的安全性"],
      en: ["1: explain &age", "1: explain scanf's return", "1: lower-bound check", "1: upper-bound check", "1: explain safe short-circuiting"],
    },
  },
  {
    id: "c-0-difficulty-03",
    courseId: "c",
    topicId: "c-0",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "single-choice",
    cognitiveRole: "definition-boundary",
    estimatedMinutes: 6,
    answerTools: ["code-draft"],
    question: b(
      "下面的源文件可以成功编译成目标文件，但创建可执行文件失败并报告 undefined reference to area。错误发生在哪个阶段，根本原因是什么？",
      "This source compiles to an object file, but building the executable fails with “undefined reference to area”. At what stage does it fail, and why?",
    ),
    options: [
      b("预处理：stdio.h 中没有 area", "Preprocessing: stdio.h does not contain area"),
      b("编译：函数原型不能写在 main 前面", "Compilation: a prototype cannot precede main"),
      b("链接：只有 area 的声明和调用，没有可链接的函数定义", "Linking: area is declared and called, but no linkable definition is provided"),
      b("运行：area 返回了未初始化的值", "Runtime: area returns an uninitialised value"),
    ],
    answer: 2,
    visual: {
      kind: "code",
      title: b("构建失败的源文件", "Source that fails to link"),
      code: `#include <stdio.h>

double area(double radius);

int main(void) {
    printf("%.2f\\n", area(2.0));
    return 0;
}`,
    },
    explanation: b(
      "第 1 步｜区分声明与定义\n原型 double area(double radius); 告诉编译器函数的名字、参数和返回类型，但不提供函数体。\n\n第 2 步｜解释为何编译能通过\n调用 area(2.0) 与原型匹配，所以编译器能完成类型检查并生成一个等待解析的外部符号。\n\n第 3 步｜定位失败阶段\n链接器需要在本目标文件、其他目标文件或库中找到 area 的唯一定义；题目没有提供，因此出现 undefined reference。\n\n第 4 步｜给出修复方案\n在某个 .c 文件中实现 double area(double radius) { ... }，并把该文件一起编译链接；仅重复写原型无效。\n\n第 5 步｜结论\n选择 C。这不是运行时错误，因为可执行文件尚未生成。",
      "Step 1 | Separate declaration from definition\nThe prototype double area(double radius); supplies the name and type contract, but no function body.\n\nStep 2 | Explain successful compilation\nThe call matches the prototype, so the compiler can type-check it and emit an unresolved external symbol.\n\nStep 3 | Locate the failed stage\nThe linker must find one definition of area in an object file or library. None is supplied, hence “undefined reference”.\n\nStep 4 | State the repair\nImplement area in one .c file and include that object in the link. Repeating the prototype does not create executable code.\n\nStep 5 | Conclude\nChoose C. It cannot be a runtime error because no executable was produced.",
    ),
    rubric: {
      zh: ["1 分：区分声明与定义", "1 分：说明编译可通过", "2 分：定位链接阶段", "1 分：给出正确修复"],
      en: ["1: distinguish declaration and definition", "1: explain successful compilation", "2: identify linking", "1: give the correct repair"],
    },
  },
  {
    id: "c-1-difficulty-01",
    courseId: "c",
    topicId: "c-1",
    kind: "data",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "multi-step-calculation",
    estimatedMinutes: 6,
    answerTools: ["code-draft"],
    question: b(
      "追踪函数调用与表达式类型。程序输出什么？",
      "Trace the function call and expression types. What does the program print?",
    ),
    options: [b("4.0", "4.0"), b("4.2", "4.2"), b("5.0", "5.0"), b("4.5", "4.5")],
    answer: 3,
    visual: {
      kind: "code",
      title: b("函数与混合类型表达式", "Function and mixed-type expression"),
      code: `#include <stdio.h>

int half(int x) {
    return x / 2;
}

int main(void) {
    double y = half(5) + 5 / 2.0;
    printf("%.1f\\n", y);
}`,
    },
    explanation: b(
      "第 1 步｜先计算函数返回值\nhalf 的参数和返回类型都是 int，函数体中的 5/2 执行整数除法，返回 2。\n\n第 2 步｜计算主函数的第二项\n表达式 5/2.0 含 double 操作数，5 被转换为 double，结果为 2.5。\n\n第 3 步｜执行通常算术转换\n相加时 int 值 2 转为 double，与 2.5 相加得到 4.5。\n\n第 4 步｜检查输出格式\n%.1f 需要 double 并输出一位小数，所以显示 4.5。\n\n第 5 步｜识别干扰项来源\n把 half(5) 错当成 2.5 会得到 5.0；函数的返回类型不会自动改变函数体中已完成的整数除法。故选 D。",
      "Step 1 | Evaluate the function\nhalf takes and returns int. Its 5/2 is integer division, so it returns 2.\n\nStep 2 | Evaluate the second term\n5/2.0 contains a double operand; 5 is converted and the result is 2.5.\n\nStep 3 | Apply the usual arithmetic conversions\nFor addition, integer 2 is converted to double. The sum is 2.0+2.5=4.5.\n\nStep 4 | Check the format\n%.1f prints the double with one fractional digit, producing 4.5.\n\nStep 5 | Explain the distractor\nTreating half(5) as 2.5 gives 5.0, but a later return conversion cannot change division already performed as int. Choose D.",
    ),
    rubric: {
      zh: ["1 分：函数内整数除法", "1 分：5/2.0 的类型", "1 分：相加时的转换", "1 分：格式化输出", "1 分：最终答案"],
      en: ["1: integer division in the function", "1: type of 5/2.0", "1: conversion during addition", "1: formatted output", "1: final answer"],
    },
  },
  {
    id: "c-1-difficulty-02",
    courseId: "c",
    topicId: "c-1",
    kind: "multiple",
    difficulty: "instructor",
    responseMode: "multi-select",
    cognitiveRole: "definition-boundary",
    estimatedMinutes: 8,
    answerTools: ["code-draft"],
    question: b(
      "多选：关于下面这个函数接口及其调用，哪些说法正确？",
      "Multiple select: which statements about this function interface and its calls are correct?",
    ),
    options: [
      b("const int *a 表示函数不应通过 a 修改数组元素", "const int *a says the function must not modify elements through a"),
      b("把数组传给 mean 会自动复制全部元素", "Passing an array to mean automatically copies every element"),
      b("若 sum 和 n 是整数，(double)sum / n 可避免整数除法", "If sum and n are integers, (double)sum / n avoids integer division"),
      b("只要 n 为 0，表达式 sum/n 就定义为 0", "When n is zero, sum/n is defined to be zero"),
    ],
    answer: [0, 2],
    visual: {
      kind: "code",
      title: b("待审查接口", "Interface under review"),
      code: `double mean(const int *a, size_t n);

int scores[] = {68, 74, 91, 87};
double m = mean(scores, 4);`,
    },
    explanation: b(
      "第 1 步｜读取 const 的约束\nconst int *a 允许读取 a[i]，但函数不能经由这个指针给元素赋值，因此 A 正确；它不保证别处没有可写别名。\n\n第 2 步｜判断数组传参机制\n数组实参在此表达式中转换为首元素指针，函数接收地址和独立长度，不会自动复制整个数组，所以 B 错。\n\n第 3 步｜分析平均值表达式\n若先做 sum/n，两者为整数会截断。把 sum 在除法前转为 double，会使 n 也参与浮点运算，C 正确。\n\n第 4 步｜检查边界 n=0\n整数除以零是未定义行为；浮点除零也不是可接受的平均值语义。函数必须先处理 n==0，因此 D 错。\n\n第 5 步｜结论\n选择 A、C。完整接口设计还应在文档中说明 a 是否可为 NULL，以及 n==0 时的处理方式。",
      "Step 1 | Read the const contract\nconst int *a permits reads but forbids assignment through a, so A is correct. It does not prove that no writable alias exists elsewhere.\n\nStep 2 | Determine array-argument semantics\nThe array expression converts to a pointer to its first element. The function receives an address plus a separate length; no full-array copy occurs, so B is false.\n\nStep 3 | Analyse the mean expression\nsum/n truncates when both are integers. Casting sum before division makes the operation floating-point, so C is correct.\n\nStep 4 | Check n=0\nInteger division by zero is undefined, and floating division by zero is not a meaningful average contract. The function must handle n==0 first; D is false.\n\nStep 5 | Conclude\nSelect A and C. A complete API should also document null-pointer and empty-range behaviour.",
    ),
    rubric: {
      zh: ["1 分：const 语义", "1 分：数组退化为指针", "1 分：转换位置", "1 分：零长度边界", "1 分：A、C 均选且无多选"],
      en: ["1: const semantics", "1: array-to-pointer conversion", "1: cast placement", "1: zero-length boundary", "1: select A and C only"],
    },
  },
  {
    id: "c-1-difficulty-03",
    courseId: "c",
    topicId: "c-1",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "error-analysis",
    cognitiveRole: "transfer",
    estimatedMinutes: 9,
    answerTools: ["code-draft"],
    question: b(
      "average 既要拒绝无效参数，又要把精确结果交给调用者。哪一个重写最完整？",
      "average must reject invalid arguments and return an exact result to its caller. Which rewrite is the most complete?",
    ),
    options: [
      b(
        "int average(int total,int count,double *out){ if(count<=0 || out==NULL) return 0; *out=(double)total/count; return 1; }",
        "int average(int total,int count,double *out){ if(count<=0 || out==NULL) return 0; *out=(double)total/count; return 1; }",
      ),
      b("double average(int total,int count){ return total/count; }", "double average(int total,int count){ return total/count; }"),
      b("int average(int total,int count){ return (double)total/count; }", "int average(int total,int count){ return (double)total/count; }"),
      b("void average(int total,int count,double *out){ *out=total/count; }", "void average(int total,int count,double *out){ *out=total/count; }"),
    ],
    answer: 0,
    visual: {
      kind: "code",
      title: b("原始实现", "Original implementation"),
      code: `double average(int total, int count) {
    return total / count;
}`,
    },
    explanation: b(
      "第 1 步｜列出原实现的两个独立缺陷\ncount==0 会触发整数除零；count>0 时 total/count 仍先做整数除法，之后才转成 double。\n\n第 2 步｜检查输出通道\nA 用 double *out 交付结果，并先确认 out!=NULL，避免写入无效地址。\n\n第 3 步｜检查错误通道\nA 以返回值 0/1 明确区分失败与成功，并在任何除法前拒绝 count<=0。\n\n第 4 步｜检查数值精度\n(double)total/count 在除法前转换一个操作数，因此得到浮点商；B、D 都会先截断，C 又把结果返回为 int。\n\n第 5 步｜结论与调用规则\n选择 A。调用者还必须检查返回状态，只有成功时才读取 out 中的结果。",
      "Step 1 | List the two independent defects\ncount==0 causes integer division by zero. For positive count, total/count still performs integer division before conversion to double.\n\nStep 2 | Check the output channel\nA returns the result through double *out and first verifies out!=NULL, preventing a write through an invalid pointer.\n\nStep 3 | Check the error channel\nA uses 0/1 to distinguish failure from success and rejects count<=0 before any division.\n\nStep 4 | Check precision\n(double)total/count converts before division, preserving a fractional quotient. B and D truncate first; C converts but then returns int.\n\nStep 5 | Conclude and state caller responsibility\nChoose A. The caller must check the status and read *out only after success.",
    ),
    rubric: {
      zh: ["1 分：识别除零", "1 分：识别整数截断", "1 分：检查 out", "1 分：解释状态返回值", "1 分：说明调用者责任"],
      en: ["1: identify division by zero", "1: identify integer truncation", "1: validate out", "1: explain the status return", "1: state caller responsibility"],
    },
  },
  {
    id: "c-2-difficulty-01",
    courseId: "c",
    topicId: "c-2",
    kind: "data",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "multi-step-calculation",
    estimatedMinutes: 7,
    answerTools: ["code-draft"],
    question: b(
      "逐次追踪 continue 和内层循环。最终输出的 s 是多少？",
      "Trace continue and the inner loop iteration by iteration. What final value of s is printed?",
    ),
    options: [b("10", "10"), b("13", "13"), b("16", "16"), b("18", "18")],
    answer: 1,
    visual: {
      kind: "code",
      title: b("嵌套循环追踪", "Nested-loop trace"),
      code: `int s = 0;
for (int i = 1; i <= 4; ++i) {
    if (i % 2 == 0) continue;
    for (int j = 0; j < i; ++j) {
        s += i + j;
    }
}
printf("%d\\n", s);`,
    },
    explanation: b(
      "第 1 步｜确定外层哪些迭代会进入内层\n当 i 为偶数 2、4 时执行 continue，跳到下一次外层迭代；只有 i=1 和 i=3 进入内层。\n\n第 2 步｜计算 i=1\nj 从 0 到小于 1，只取 0，因此 s 增加 1+0=1。\n\n第 3 步｜计算 i=3\nj 依次为 0、1、2，增量分别为 3、4、5，总增量 12。\n\n第 4 步｜累加并确认边界\n最终 s=1+12=13。条件 j<i 不包含 j=i，i<=4 则包含外层 i=4，但它被 continue 跳过。\n\n第 5 步｜结论\n输出 13，选 B。追踪嵌套循环时先列出实际进入内层的 i，能避免把 continue 误认为只跳过 if。",
      "Step 1 | Identify outer iterations reaching the inner loop\nFor even i values 2 and 4, continue jumps to the next outer iteration. Only i=1 and i=3 enter the inner loop.\n\nStep 2 | Evaluate i=1\nj runs from 0 while j<1, so the only increment is 1+0=1.\n\nStep 3 | Evaluate i=3\nj is 0, 1 and 2. The increments are 3, 4 and 5, totalling 12.\n\nStep 4 | Add and audit boundaries\nThe final value is 1+12=13. j<i excludes j=i; i<=4 includes i=4, but continue skips its body.\n\nStep 5 | Conclude\nThe program prints 13, choice B. For nested traces, list the outer values that actually reach the inner loop first.",
    ),
    rubric: {
      zh: ["1 分：排除偶数 i", "1 分：i=1 追踪", "2 分：i=3 追踪", "1 分：最终 13", "1 分：说明循环边界"],
      en: ["1: skip even i", "1: trace i=1", "2: trace i=3", "1: final 13", "1: explain loop boundaries"],
    },
  },
  {
    id: "c-2-difficulty-02",
    courseId: "c",
    topicId: "c-2",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "single-choice",
    cognitiveRole: "definition-boundary",
    estimatedMinutes: 8,
    answerTools: ["code-draft"],
    question: b(
      "函数在升序数组中返回第一个不小于 key 的位置。若所有元素都小于 key，关于返回值和调用者责任的哪项说明正确？",
      "The function returns the first position whose value is not less than key. If every element is below key, which statement correctly describes the return value and caller responsibility?",
    ),
    options: [
      b("返回 n-1，可直接读取 a[n-1]", "It returns n-1, which can be read directly"),
      b("循环无法终止，因为 hi 从不增加", "The loop cannot terminate because hi never increases"),
      b("返回 n，表示尾后插入位置；调用者在读取 a[result] 前必须检查 result<n", "It returns n, the one-past-end insertion position; the caller must check result<n before reading a[result]"),
      b("访问 a[mid] 必然越界，因为 hi 初始等于 n", "a[mid] is necessarily out of bounds because hi starts at n"),
    ],
    answer: 2,
    visual: {
      kind: "code",
      title: b("半开区间二分查找", "Half-open binary search"),
      code: `size_t first_ge(const int a[], size_t n, int key) {
    size_t lo = 0, hi = n;
    while (lo < hi) {
        size_t mid = lo + (hi - lo) / 2;
        if (a[mid] < key) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,
    },
    explanation: b(
      "第 1 步｜写出循环不变量\n待搜索区间是半开区间 [lo,hi)，hi=n 合法，因为 hi 本身从不被当作数组下标。\n\n第 2 步｜检查 mid 的安全性\n只要 lo<hi，(hi-lo)/2 小于 hi-lo，所以 lo<=mid<hi<=n，实际访问时 mid<n。\n\n第 3 步｜追踪“全部小于 key”\n每次比较都满足 a[mid]<key，于是 lo=mid+1，区间严格缩小，最终 lo==hi==n。\n\n第 4 步｜解释 n 的语义\nn 是合法的尾后插入位置，却不是合法元素下标。调用者可在该位置追加，但不能读取 a[n]。\n\n第 5 步｜结论\n选择 C；安全 API 不只要返回位置，还要让调用者区分“找到元素”和“返回尾后位置”。",
      "Step 1 | State the invariant\nThe search range is half-open [lo,hi). hi=n is valid because hi itself is never used as an array index.\n\nStep 2 | Prove mid is safe\nWhen lo<hi, (hi-lo)/2 is less than hi-lo, so lo<=mid<hi<=n and every accessed mid is below n.\n\nStep 3 | Trace the all-smaller case\nEvery comparison takes a[mid]<key, assigning lo=mid+1. The interval shrinks strictly until lo==hi==n.\n\nStep 4 | Interpret n\nn is a valid one-past-end insertion position but not an element index. It may describe append position; a[n] must not be read.\n\nStep 5 | Conclude\nChoose C. A safe caller distinguishes a returned position from a confirmed in-bounds element.",
    ),
    rubric: {
      zh: ["1 分：半开区间", "1 分：证明 mid<n", "1 分：说明区间缩小", "1 分：结果 n", "1 分：调用者边界检查"],
      en: ["1: half-open interval", "1: prove mid<n", "1: show interval shrinkage", "1: result n", "1: caller boundary check"],
    },
  },
  {
    id: "c-2-difficulty-03",
    courseId: "c",
    topicId: "c-2",
    kind: "combination",
    difficulty: "instructor",
    responseMode: "single-choice",
    cognitiveRole: "error-analysis",
    estimatedMinutes: 7,
    answerTools: ["code-draft"],
    question: b(
      "组合题：判断三句话。① 原程序输出 6；② 在 case 2 末尾加 break 后输出 2；③ default 只会在没有 case 匹配时执行。哪组正确？",
      "Combination: judge the claims. ① The original prints 6. ② Adding break after case 2 makes it print 2. ③ default executes only when no case matches. Which combination is correct?",
    ),
    options: [
      b("只有①", "① only"),
      b("只有②③", "② and ③ only"),
      b("只有①③", "① and ③ only"),
      b("只有①②", "① and ② only"),
    ],
    answer: 3,
    visual: {
      kind: "code",
      title: b("switch 穿透", "switch fall-through"),
      code: `int x = 2, y = 0;
switch (x) {
    case 1: y += 1; break;
    case 2: y += 2;
    default: y += 4;
}
printf("%d\\n", y);`,
    },
    explanation: b(
      "第 1 步｜定位入口标签\nx==2，因此控制流直接进入 case 2，不执行 case 1。\n\n第 2 步｜追踪没有 break 的路径\ncase 2 先令 y=2；其末尾没有 break，于是继续穿透到 default，再加 4，最终 y=6，所以①正确。\n\n第 3 步｜验证修改后的行为\n若在 case 2 后加入 break，执行 y+=2 后离开 switch，输出 2，所以②正确。\n\n第 4 步｜判断 default 的真实规则\ndefault 不仅能作为“无匹配入口”，也可能被前一个 case 穿透执行；因此③的“只会”过强，是错误的。\n\n第 5 步｜匹配组合\n只有①②正确，对应 D。组合题应先逐句判定，再看组合选项。",
      "Step 1 | Locate the entry label\nBecause x==2, control enters case 2 directly and does not execute case 1.\n\nStep 2 | Trace the path without break\ncase 2 changes y to 2. With no break, execution falls through into default and adds 4, so y becomes 6. Claim ① is correct.\n\nStep 3 | Test the proposed modification\nA break after case 2 exits the switch immediately after y+=2, so the output becomes 2. Claim ② is correct.\n\nStep 4 | Judge the real default rule\ndefault can be the no-match entry, but it can also be reached by fall-through from a preceding case. The word “only” makes ③ false.\n\nStep 5 | Match the combination\nOnly ① and ② are correct, choice D. Judge each claim before looking at combinations.",
    ),
    rubric: {
      zh: ["1 分：case 2 为入口", "1 分：追踪到 6", "1 分：解释 break 后为 2", "1 分：指出 default 可被穿透", "1 分：组合 D"],
      en: ["1: enter case 2", "1: trace to 6", "1: explain result 2 with break", "1: note fall-through into default", "1: combination D"],
    },
  },
  {
    id: "c-3-difficulty-01",
    courseId: "c",
    topicId: "c-3",
    kind: "multiple",
    difficulty: "instructor",
    responseMode: "multi-select",
    cognitiveRole: "definition-boundary",
    estimatedMinutes: 8,
    answerTools: ["code-draft"],
    question: b(
      "多选：关于数组 s 及后续两行代码，哪些判断正确？",
      "Multiple select: which claims about array s and the following two lines are correct?",
    ),
    options: [
      b('初始化 char s[5]="abcd" 本身会越界', 'The initialisation char s[5]="abcd" itself overflows'),
      b("在声明所在作用域内，sizeof s 的值为 5", "In the declaration scope, sizeof s is 5"),
      b("初始状态下 strlen(s) 的值为 5", "Initially, strlen(s) is 5"),
      b("执行 s[4]='X' 后再用 %s 输出会产生未定义行为", "After s[4]='X', printing with %s has undefined behaviour"),
    ],
    answer: [1, 3],
    visual: {
      kind: "code",
      title: b("字符串边界审查", "String-boundary audit"),
      code: `char s[5] = "abcd";
size_t capacity = sizeof s;
s[4] = 'X';
printf("%s\\n", s);`,
    },
    explanation: b(
      "第 1 步｜计算初始化所需容量\n\"abcd\" 有 4 个可见字符和 1 个结尾 '\\0'，总共正好 5 个 char，因此初始化不越界，A 错。\n\n第 2 步｜区分 sizeof 与 strlen\n在 s 仍是数组的作用域中，sizeof s 给出整个数组的字节数 5；初始 strlen(s) 只数 '\\0' 前的 4 个字符，所以 B 对、C 错。\n\n第 3 步｜追踪终止符被覆盖后的状态\ns[4]='X' 把唯一的 '\\0' 改掉，数组内容不再构成以空字符结尾的 C 字符串。\n\n第 4 步｜检查 %s 的前置条件\n%s 会持续读取直到遇到 '\\0'；它可能读过数组末尾，越界读取导致未定义行为，所以 D 对。\n\n第 5 步｜结论\n选择 B、D。数组容量、字符串长度和当前是否仍有终止符是三个不同问题。",
      "Step 1 | Compute the required initial capacity\n\"abcd\" contains four visible characters plus one terminating '\\0', exactly five char objects. The initialisation fits, so A is false.\n\nStep 2 | Separate sizeof from strlen\nWhere s is still an array, sizeof s is the full array size, 5 bytes. Initially strlen(s) counts four characters before '\\0', so B is true and C false.\n\nStep 3 | Trace the overwritten terminator\ns[4]='X' replaces the only '\\0'. The array no longer contains a null-terminated C string.\n\nStep 4 | Check %s's precondition\n%s keeps reading until it finds '\\0'. It may read beyond the array, which is undefined behaviour. D is true.\n\nStep 5 | Conclude\nSelect B and D. Capacity, string length and current termination are separate properties.",
    ),
    rubric: {
      zh: ["1 分：计算 5 字节容量", "1 分：sizeof=5", "1 分：strlen=4", "2 分：解释终止符与越界读取", "1 分：只选 B、D"],
      en: ["1: compute five-byte capacity", "1: sizeof=5", "1: strlen=4", "2: explain terminator and over-read", "1: select B and D only"],
    },
  },
  {
    id: "c-3-difficulty-02",
    courseId: "c",
    topicId: "c-3",
    kind: "data",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "representation",
    estimatedMinutes: 7,
    answerTools: ["code-draft"],
    question: b(
      "在本题所示一维数组中追踪指针算术。程序输出什么？",
      "Trace the pointer arithmetic within the shown one-dimensional array. What does the program print?",
    ),
    options: [b("8", "8"), b("9", "9"), b("10", "10"), b("11", "11")],
    answer: 0,
    visual: {
      kind: "code",
      title: b("一维数组的连续元素", "Contiguous elements of a 1D array"),
      code: `int a[] = {1, 2, 3, 4, 5, 6};
int *p = a;
printf("%d\\n", *(p + 4) + a[2]);`,
    },
    explanation: b(
      "第 1 步｜建立数组顺序\n一维数组 a 的 6 个 int 元素依次是 1,2,3,4,5,6，下标范围为 0–5。\n\n第 2 步｜定位 p\n数组名在此表达式中转为首元素指针，因此 p 指向 a[0]；p+4 按 int 元素移动四格，落到 a[4]。\n\n第 3 步｜读取两个操作数\n*(p+4)=a[4]=5，而 a[2]=3。\n\n第 4 步｜完成表达式\n5+3=8，因此 printf 输出 8。\n\n第 5 步｜边界检查\n本次 p+4 仍指向同一一维数组对象中的元素；可以形成尾后指针 a+6，但不能解引用它，更不能越过该边界。故选 A。",
      "Step 1 | Establish array order\nThe one-dimensional array contains six int elements 1,2,3,4,5,6 with valid indices 0–5.\n\nStep 2 | Locate p\nHere the array name converts to a pointer to its first element, so p points to a[0]. Adding 4 advances by four int elements to a[4].\n\nStep 3 | Read both operands\n*(p+4)=a[4]=5, while a[2]=3.\n\nStep 4 | Complete the expression\n5+3=8, so printf prints 8.\n\nStep 5 | Check the boundary\np+4 still designates an element of the same one-dimensional array. The one-past pointer a+6 may be formed but not dereferenced, and movement beyond it is invalid. Choose A.",
    ),
    rubric: {
      zh: ["1 分：写出元素顺序", "1 分：解释指针按 int 移动", "1 分：定位 a[1][1]", "1 分：读取 a[0][2]", "1 分：结果 8"],
      en: ["1: list element order", "1: explain int-sized pointer movement", "1: locate a[1][1]", "1: read a[0][2]", "1: result 8"],
    },
  },
  {
    id: "c-3-difficulty-03",
    courseId: "c",
    topicId: "c-3",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "error-analysis",
    cognitiveRole: "error-analysis",
    estimatedMinutes: 8,
    answerTools: ["code-draft"],
    question: b(
      "fgets 成功后，原代码试图删除末尾换行。哪一段修复既不在空字符串时下溢，也不会误删一个非换行字符？",
      "After a successful fgets, the original code tries to remove a trailing newline. Which repair avoids underflow for an empty string and preserves a final non-newline character?",
    ),
    options: [
      b("buf[strlen(buf)]='\\0';", "buf[strlen(buf)]='\\0';"),
      b("size_t n=strlen(buf); if(n>0 && buf[n-1]=='\\n') buf[n-1]='\\0';", "size_t n=strlen(buf); if(n>0 && buf[n-1]=='\\n') buf[n-1]='\\0';"),
      b("buf[sizeof buf-1]='\\0';", "buf[sizeof buf-1]='\\0';"),
      b("if(buf[0]) buf[strlen(buf)]='\\n';", "if(buf[0]) buf[strlen(buf)]='\\n';"),
    ],
    answer: 1,
    visual: {
      kind: "code",
      title: b("有缺陷的换行删除", "Faulty newline removal"),
      code: `char buf[32];
if (fgets(buf, sizeof buf, stdin) != NULL) {
    buf[strlen(buf) - 1] = '\\0';
}`,
    },
    explanation: b(
      "第 1 步｜识别下溢风险\nstrlen 返回 size_t，是无符号类型。若长度为 0，strlen(buf)-1 会变成一个很大的正数，导致越界写入。\n\n第 2 步｜识别语义风险\n即使长度大于 0，fgets 也可能因缓冲区装满而没有读到 '\\n'；无条件删除最后字符会破坏有效数据。\n\n第 3 步｜按安全顺序建立条件\n先保存 n=strlen(buf)，再要求 n>0；由于 && 短路，只有此前提成立才读取 buf[n-1]。\n\n第 4 步｜只删除目标字符\n还要确认 buf[n-1]=='\\n'，之后才替换为 '\\0'。B 同时满足索引安全与题意。\n\n第 5 步｜结论\n选择 B。若还要处理 Windows 文本中的 '\\r\\n'，可在同一原则下继续检查 '\\r'，但不能无条件砍掉最后一字节。",
      "Step 1 | Identify underflow\nstrlen returns size_t, an unsigned type. If the length is zero, strlen(buf)-1 becomes a very large value and causes an out-of-bounds write.\n\nStep 2 | Identify the semantic fault\nEven for a non-empty buffer, fgets may fill the buffer before reading '\\n'. Unconditionally deleting the last character then destroys valid input.\n\nStep 3 | Build the condition safely\nStore n=strlen(buf), then require n>0. Short-circuit && ensures buf[n-1] is read only after that bound is established.\n\nStep 4 | Remove only the intended character\nAlso require buf[n-1]=='\\n' before replacing it with '\\0'. B satisfies both memory safety and the requested behaviour.\n\nStep 5 | Conclude\nChoose B. Handling '\\r\\n' can extend the same guarded method, but must not blindly discard the last byte.",
    ),
    rubric: {
      zh: ["1 分：size_t 下溢", "1 分：fgets 可能无换行", "1 分：n>0 检查", "1 分：换行检查", "1 分：解释短路求值"],
      en: ["1: size_t underflow", "1: fgets may omit newline", "1: n>0 guard", "1: newline test", "1: explain short-circuiting"],
    },
  },
  {
    id: "c-4-difficulty-01",
    courseId: "c",
    topicId: "c-4",
    kind: "data",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "representation",
    estimatedMinutes: 6,
    answerTools: ["code-draft"],
    question: b(
      "追踪结构体的按值传递。程序输出什么，为什么？",
      "Trace pass-by-value for the structure. What does the program print, and why?",
    ),
    options: [b("12 13", "12 13"), b("12 3", "12 3"), b("2 3", "2 3"), b("2 13", "2 13")],
    answer: 2,
    visual: {
      kind: "code",
      title: b("结构体参数", "Structure parameter"),
      code: `typedef struct {
    int x;
    int y;
} Point;

void shift(Point p) {
    p.x += 10;
    p.y += 10;
}

int main(void) {
    Point p = {2, 3};
    shift(p);
    printf("%d %d\\n", p.x, p.y);
}`,
    },
    explanation: b(
      "第 1 步｜识别参数类型\nshift 的参数是 Point p，而不是 Point *p；调用时会把 main 中结构体的成员值复制到局部参数。\n\n第 2 步｜追踪函数内部修改\np.x 和 p.y 的修改只作用于 shift 的局部副本，使副本变成 {12,13}。\n\n第 3 步｜返回调用者作用域\n函数结束后局部副本生命周期结束；main 中原来的 p 从未被赋值或通过指针修改。\n\n第 4 步｜读取输出\nmain 中 p 仍为 {2,3}，所以输出 2 3。\n\n第 5 步｜迁移到修复方案\n若要修改调用者对象，应接收 Point *p、调用 shift(&p)，并用 p->x 访问成员。故选 C。",
      "Step 1 | Identify the parameter type\nshift receives Point p, not Point *p. Calling it copies the member values into a local parameter.\n\nStep 2 | Trace internal modification\nAssignments to p.x and p.y change only the local copy, producing {12,13} inside shift.\n\nStep 3 | Return to caller scope\nThe local copy ends when the function returns. main's object was never assigned or reached through a pointer.\n\nStep 4 | Read the output\nThe original p remains {2,3}, so the program prints 2 3.\n\nStep 5 | Transfer to a repair\nTo modify the caller's object, accept Point *p, call shift(&p), and use p->x. Choose C.",
    ),
    rubric: {
      zh: ["1 分：识别按值参数", "1 分：说明产生副本", "1 分：追踪副本修改", "1 分：原对象不变", "1 分：给出指针式修复"],
      en: ["1: identify by-value parameter", "1: explain the copy", "1: trace copy modification", "1: original unchanged", "1: give pointer-based repair"],
    },
  },
  {
    id: "c-4-difficulty-02",
    courseId: "c",
    topicId: "c-4",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "error-analysis",
    cognitiveRole: "error-analysis",
    estimatedMinutes: 9,
    answerTools: ["code-draft"],
    question: b(
      "文件中是以空白分隔的整数。原循环可能在最后一次成功读取后再次累加旧值。哪一项是最直接且正确的重写？",
      "The file contains whitespace-separated integers. The original loop may add a stale value after the final successful read. Which is the most direct correct rewrite?",
    ),
    options: [
      b("while(!feof(fp)){ sum += x; fscanf(fp,\"%d\",&x); }", "while(!feof(fp)){ sum += x; fscanf(fp,\"%d\",&x); }"),
      b("while(fscanf(fp,\"%d\",&x)!=EOF) sum+=x;", "while(fscanf(fp,\"%d\",&x)!=EOF) sum+=x;"),
      b("do { fscanf(fp,\"%d\",&x); sum+=x; } while(x);", "do { fscanf(fp,\"%d\",&x); sum+=x; } while(x);"),
      b("if(fp==NULL) return 1; while(fscanf(fp,\"%d\",&x)==1) sum+=x;", "if(fp==NULL) return 1; while(fscanf(fp,\"%d\",&x)==1) sum+=x;"),
    ],
    answer: 3,
    visual: {
      kind: "code",
      title: b("错误的 EOF 循环", "Faulty EOF loop"),
      code: `FILE *fp = fopen("scores.txt", "r");
int x, sum = 0;
while (!feof(fp)) {
    fscanf(fp, "%d", &x);
    sum += x;
}
fclose(fp);`,
    },
    explanation: b(
      "第 1 步｜先检查资源是否取得\nfopen 失败返回 NULL；把 NULL 传给 feof、fscanf 或 fclose 都不满足这些函数的要求，所以必须先检查 fp。\n\n第 2 步｜理解 EOF 指示器的时机\nfeof 只有在一次读取尝试已经遇到文件末尾后才置位；最后一个整数读完时它通常仍为假，因此循环会多进入一次。\n\n第 3 步｜把读取结果作为循环条件\nfscanf 返回成功赋值的项目数。本格式只有一个 %d，所以 ==1 正好表示 x 获得了一个新值。\n\n第 4 步｜比较 !=EOF 的不足\n遇到不符合 %d 的非数字文本时 fscanf 可能返回 0，而 0!=EOF，B 会卡住；==1 同时正确处理 EOF 与匹配失败。\n\n第 5 步｜结论\nD 先验证 fp，再只在成功读取时累加。循环结束后仍应 fclose(fp)，并可根据需求区分格式错误和正常 EOF。",
      "Step 1 | Verify the resource was acquired\nfopen returns NULL on failure. Passing NULL to feof, fscanf or fclose violates their requirements, so fp must be checked first.\n\nStep 2 | Understand when EOF is set\nfeof becomes true only after a read attempt encounters end-of-file. Immediately after the last integer is read it is generally still false, causing one extra iteration.\n\nStep 3 | Make the read result the loop condition\nfscanf returns the number of successful assignments. With one %d, ==1 exactly means x received a fresh value.\n\nStep 4 | See why !=EOF is insufficient\nOn non-numeric input, fscanf may return 0. Since 0!=EOF, B can loop without consuming input. ==1 handles both EOF and matching failure safely.\n\nStep 5 | Conclude\nD validates fp and adds only newly read values. The successful path should still fclose(fp), and production code may distinguish malformed input from normal EOF.",
    ),
    rubric: {
      zh: ["1 分：检查 fopen", "1 分：解释 feof 滞后", "2 分：解释 fscanf==1", "1 分：指出返回 0 的情况", "1 分：资源关闭"],
      en: ["1: check fopen", "1: explain delayed feof", "2: explain fscanf==1", "1: identify return 0", "1: close the resource"],
    },
  },
  {
    id: "c-4-difficulty-03",
    courseId: "c",
    topicId: "c-4",
    kind: "multiple",
    difficulty: "instructor",
    responseMode: "multi-select",
    cognitiveRole: "definition-boundary",
    estimatedMinutes: 8,
    answerTools: ["code-draft"],
    question: b(
      "多选：关于结构体指针和文件持久化，哪些说法正确？",
      "Multiple select: which statements about structure pointers and file persistence are correct?",
    ),
    options: [
      b("若 p 指向有效 Student 对象，p->mark 等价于 (*p).mark", "If p points to a valid Student, p->mark is equivalent to (*p).mark"),
      b("把 struct 用 fwrite 原样写入文件，保证能在所有平台和版本间移植", "Writing a struct directly with fwrite guarantees portability across platforms and versions"),
      b('以 "a" 模式打开文本文件时，写入会追加到文件末尾', 'Opening a text file with mode "a" appends writes at the end'),
      b("fclose(NULL) 是标准规定的安全空操作", "fclose(NULL) is a standard-defined safe no-op"),
    ],
    answer: [0, 2],
    visual: {
      kind: "table",
      title: b("接口审查对象", "Interfaces under review"),
      columns: [b("对象", "Object"), b("相关操作", "Relevant operation")],
      rows: [
        ["Student *p", "p->mark / (*p).mark"],
        ["FILE *fp", "fopen, fwrite, fclose"],
        ["record file", "layout and portability"],
      ],
    },
    explanation: b(
      "第 1 步｜展开箭头运算符\np->mark 按定义等价于 (*p).mark，前提是 p 指向生命周期内的有效 Student；因此 A 正确。\n\n第 2 步｜检查二进制布局假设\n结构体可能含填充字节，整数表示、字节序和结构体版本也可能不同；直接 fwrite 不是跨平台序列化格式，所以 B 错。\n\n第 3 步｜读取文件模式\n\"a\" 是追加文本模式，写操作定位到文件末尾，C 正确；它与 \"w\" 的截断行为不同。\n\n第 4 步｜检查关闭操作前提\nfclose 要求有效的打开流；NULL 不是流对象，标准没有把 fclose(NULL) 定义为空操作，D 错。\n\n第 5 步｜结论\n选择 A、C。可靠持久化应定义字段格式与版本，并对每次打开、读写和关闭结果进行检查。",
      "Step 1 | Expand the arrow operator\np->mark is defined as (*p).mark, provided p points to a live valid Student object. A is correct.\n\nStep 2 | Audit binary-layout assumptions\nA struct may contain padding, and integer representation, endianness or record versions can differ. Raw fwrite is not a portable serialization format, so B is false.\n\nStep 3 | Read the file mode\n\"a\" is append text mode; writes are placed at the end. C is correct and differs from truncating \"w\".\n\nStep 4 | Check the close precondition\nfclose requires a valid open stream. NULL is not a stream and the standard does not define fclose(NULL) as a no-op. D is false.\n\nStep 5 | Conclude\nSelect A and C. Reliable persistence defines a field format and version, then checks every open, I/O and close result.",
    ),
    rubric: {
      zh: ["1 分：解释 ->", "2 分：说明布局不可移植", "1 分：解释追加模式", "1 分：fclose 前置条件", "1 分：只选 A、C"],
      en: ["1: explain ->", "2: explain layout non-portability", "1: explain append mode", "1: fclose precondition", "1: select A and C only"],
    },
  },
  {
    id: "c-5-difficulty-01",
    courseId: "c",
    topicId: "c-5",
    kind: "data",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "multi-step-calculation",
    estimatedMinutes: 7,
    answerTools: ["code-draft"],
    question: b(
      "在所有指针都保持数组范围内的前提下追踪代码。输出是哪一项？",
      "Trace the code while checking that every pointer remains within the array. Which output is correct?",
    ),
    options: [b("20 30", "20 30"), b("20 40", "20 40"), b("30 30", "30 30"), b("30 40", "30 40")],
    answer: 0,
    visual: {
      kind: "code",
      title: b("指针偏移追踪", "Pointer-offset trace"),
      code: `int a[] = {10, 20, 30, 40};
int *p = a + 1;
printf("%d %d\\n", *p, *(p + 2) - p[-1]);`,
    },
    explanation: b(
      "第 1 步｜定位基准指针\n数组名在初始化表达式中转成首元素指针，a+1 指向 a[1]，其值为 20。\n\n第 2 步｜解释正偏移\np+2 从 a[1] 前进两个 int 元素，指向 a[3]，所以 *(p+2)=40。\n\n第 3 步｜解释负下标\np[-1] 等价于 *(p-1)。p-1 指回 a[0]，值为 10；这里仍在同一数组内。\n\n第 4 步｜完成第二个输出值\n40-10=30，因此两个输出依次为 20 和 30。\n\n第 5 步｜结论与边界\n选择 A。负下标语法本身不自动错误，是否安全取决于最终地址是否仍指向同一数组对象的元素。",
      "Step 1 | Locate the base pointer\nIn the initializer, a converts to a pointer to its first element. a+1 points to a[1], whose value is 20.\n\nStep 2 | Interpret the positive offset\np+2 advances two int elements from a[1] to a[3], so *(p+2)=40.\n\nStep 3 | Interpret the negative subscript\np[-1] is *(p-1). That points back to a[0], value 10, still within the same array.\n\nStep 4 | Complete the second output\n40-10=30, so the output values are 20 and 30.\n\nStep 5 | Conclude and state the boundary\nChoose A. A negative subscript is not automatically invalid; safety depends on the resulting pointer remaining within the same array object.",
    ),
    rubric: {
      zh: ["1 分：定位 p=a[1]", "1 分：解释 p+2", "1 分：解释 p[-1]", "1 分：计算 30", "1 分：说明数组边界"],
      en: ["1: locate p at a[1]", "1: explain p+2", "1: explain p[-1]", "1: calculate 30", "1: state array bounds"],
    },
  },
  {
    id: "c-5-difficulty-02",
    courseId: "c",
    topicId: "c-5",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "error-analysis",
    cognitiveRole: "error-analysis",
    estimatedMinutes: 9,
    answerTools: ["code-draft"],
    question: b(
      "grow 需要扩大调用者拥有的动态数组，并在 realloc 失败时保留原数组。哪一种调用端模式正确？",
      "grow must enlarge a caller-owned dynamic array while preserving the original allocation if realloc fails. Which caller-side pattern is correct?",
    ),
    options: [
      b("p=realloc(p,new_n*sizeof *p); if(!p) use(p);", "p=realloc(p,new_n*sizeof *p); if(!p) use(p);"),
      b("int *tmp=realloc(p,new_n*sizeof *p); if(tmp!=NULL) p=tmp; else handle_error_using_old_p(p);", "int *tmp=realloc(p,new_n*sizeof *p); if(tmp!=NULL) p=tmp; else handle_error_using_old_p(p);"),
      b("free(p); p=realloc(p,new_n*sizeof *p);", "free(p); p=realloc(p,new_n*sizeof *p);"),
      b("int *tmp=realloc(p,new_n); p=tmp;", "int *tmp=realloc(p,new_n); p=tmp;"),
    ],
    answer: 1,
    visual: {
      kind: "code",
      title: b("危险的直接赋值", "Dangerous direct assignment"),
      code: `int *p = malloc(n * sizeof *p);
/* ... */
p = realloc(p, new_n * sizeof *p);
if (p == NULL) {
    /* original address has been lost */
}`,
    },
    explanation: b(
      "第 1 步｜写出 realloc 的两种结果\n成功时它返回可用地址，旧地址可能已失效；失败时返回 NULL，但原分配保持有效且仍由调用者负责。\n\n第 2 步｜识别直接覆盖的资源泄漏\n把返回值直接写回 p，失败时会丢失原地址；内存未释放，却再也无法访问或 free。\n\n第 3 步｜使用临时指针保存事务性\nB 先把结果放入 tmp。只有 tmp!=NULL 才提交给 p；否则 p 仍指向原数组，可继续使用或释放。\n\n第 4 步｜审查其他错误\n对已 free 的 p 调 realloc 是无效使用；realloc 的大小参数是字节数，D 漏乘 sizeof *p 且也无失败分支。\n\n第 5 步｜结论\n选择 B。成功后只使用新 p；失败后只使用仍有效的旧 p，并最终确保恰好 free 一次。",
      "Step 1 | State realloc's two outcomes\nOn success it returns usable storage and the old address may cease to be valid. On failure it returns NULL while the original allocation remains valid and caller-owned.\n\nStep 2 | Identify the leak caused by direct overwrite\nAssigning directly to p loses the original address on failure. The block remains allocated but can no longer be accessed or freed.\n\nStep 3 | Use a temporary pointer transactionally\nB stores the result in tmp and commits it to p only on success. On failure, p still names the original array for continued use or cleanup.\n\nStep 4 | Audit the other defects\nCalling realloc on an already freed pointer is invalid. Its size is in bytes, so D omits sizeof *p and also ignores failure.\n\nStep 5 | Conclude\nChoose B. After success use only the new p; after failure retain the old p, and eventually free exactly once.",
    ),
    rubric: {
      zh: ["1 分：realloc 失败语义", "1 分：识别地址丢失", "2 分：解释临时指针模式", "1 分：字节数计算", "1 分：所有权与一次释放"],
      en: ["1: realloc failure semantics", "1: identify lost address", "2: explain temporary-pointer pattern", "1: byte-size calculation", "1: ownership and one free"],
    },
  },
  {
    id: "c-5-difficulty-03",
    courseId: "c",
    topicId: "c-5",
    kind: "multiple",
    difficulty: "instructor",
    responseMode: "multi-select",
    cognitiveRole: "definition-boundary",
    estimatedMinutes: 8,
    answerTools: ["code-draft"],
    question: b(
      "多选：执行 free(p) 之后，关于别名 q 和两个指针变量，哪些说法正确？",
      "Multiple select: after free(p), which statements about alias q and the two pointer variables are correct?",
    ),
    options: [
      b("只要 q 不等于 NULL，就仍可安全读取 *q", "As long as q is non-NULL, *q remains safe to read"),
      b("q 成为悬空指针；解引用 q 会产生未定义行为", "q becomes dangling; dereferencing it has undefined behaviour"),
      b("再调用 free(q) 可以安全地完成第二次清理", "Calling free(q) safely performs a second cleanup"),
      b("随后令 p=NULL 不会自动改变 q 的值", "Assigning p=NULL afterwards does not automatically change q"),
    ],
    answer: [1, 3],
    visual: {
      kind: "code",
      title: b("动态内存的两个别名", "Two aliases to one allocation"),
      code: `int *p = malloc(4 * sizeof *p);
int *q = p;
/* assume allocation succeeded */
free(p);
p = NULL;`,
    },
    explanation: b(
      "第 1 步｜建立所有权关系\nfree 前，p 与 q 保存同一分配块的地址；两个变量不是两块内存，也不是自动同步的智能指针。\n\n第 2 步｜解释 free 的效果\nfree(p) 结束分配块的生命周期，但不会遍历程序并清空所有地址副本。q 仍保存旧地址，因此成为悬空指针。\n\n第 3 步｜判断可做的操作\n通过 q 读取或写入已经结束生命周期的对象是未定义行为；对同一块再次 free(q) 是 double free，也不是安全清理。故 A、C 错，B 对。\n\n第 4 步｜检查 p=NULL 的范围\n赋值只改变变量 p 自身，不改变 q，所以 D 对；把一个别名清空不能修复其他别名。\n\n第 5 步｜结论\n选择 B、D。更好的设计是明确单一所有者，并在释放前确保没有仍会被使用的别名。",
      "Step 1 | Establish ownership and aliasing\nBefore free, p and q hold the same allocation address. They are not two blocks and are not automatically synchronised smart pointers.\n\nStep 2 | Explain free\nfree(p) ends the allocation's lifetime but does not search the program and clear every copied address. q retains the old address and becomes dangling.\n\nStep 3 | Judge permitted operations\nReading or writing through q is undefined behaviour. Calling free(q) again is a double free, not additional cleanup. A and C are false; B is true.\n\nStep 4 | Scope of p=NULL\nThe assignment changes only variable p, not q, so D is true. Nulling one alias cannot repair other aliases.\n\nStep 5 | Conclude\nSelect B and D. Prefer an explicit single owner and ensure no alias remains in use before release.",
    ),
    rubric: {
      zh: ["1 分：识别同一分配块", "1 分：解释生命周期结束", "1 分：悬空解引用", "1 分：double free", "1 分：赋值不传播", "1 分：只选 B、D"],
      en: ["1: identify one allocation", "1: explain ended lifetime", "1: dangling dereference", "1: double free", "1: assignment does not propagate", "1: select B and D only"],
    },
  },
  {
    id: "c-6-difficulty-01",
    courseId: "c",
    topicId: "c-6",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "error-analysis",
    cognitiveRole: "error-analysis",
    estimatedMinutes: 8,
    answerTools: ["code-draft"],
    question: b(
      "util.h 被 a.c 和 b.c 同时包含。各文件都能编译，但链接时报告 multiple definition of clamp。哪一种结构性修复最合适？",
      "util.h is included by both a.c and b.c. Each compiles, but linking reports “multiple definition of clamp”. Which structural repair is best?",
    ),
    options: [
      b("删除 include guard，让头文件只被展开一次", "Remove the include guard so the header is expanded only once"),
      b("在每个 .c 文件中再复制一份同样的 clamp 定义", "Copy the same clamp definition into every .c file"),
      b("头文件只保留函数声明，把一个非 static 定义放进 util.c，并把 util.c 一起链接", "Keep only the declaration in the header, put one non-static definition in util.c, and link util.c"),
      b("在 main 中用 extern 重复声明 clamp 两次", "Repeat an extern declaration of clamp twice inside main"),
    ],
    answer: 2,
    visual: {
      kind: "code",
      title: b("导致多重定义的头文件", "Header causing multiple definitions"),
      code: `/* util.h */
#ifndef UTIL_H
#define UTIL_H
int clamp(int x, int low, int high) {
    if (x < low) return low;
    if (x > high) return high;
    return x;
}
#endif`,
    },
    explanation: b(
      "第 1 步｜明确 include guard 的作用范围\ninclude guard 只防止同一翻译单元内重复展开；a.c 和 b.c 是两个独立翻译单元，各自仍会生成 clamp 的外部定义。\n\n第 2 步｜定位链接冲突\n链接器看到两个同名外部定义，无法选择唯一实现，因此报告 multiple definition；这不是函数逻辑错误。\n\n第 3 步｜分离接口与实现\nutil.h 应只声明 int clamp(int,int,int);，供编译器检查调用；util.c 提供唯一函数体。\n\n第 4 步｜检查构建输入\n必须编译 util.c 并把生成的目标文件与 a.o、b.o 一起链接，否则会从“多重定义”变成“未定义引用”。\n\n第 5 步｜结论\n选择 C。极小函数也可有谨慎设计的 static inline 头文件实现，但它是另一种链接模型，不能只删 guard 或复制定义。",
      "Step 1 | Scope the include guard\nAn include guard prevents repeated expansion within one translation unit. a.c and b.c are separate translation units, so each still emits an external clamp definition.\n\nStep 2 | Locate the link conflict\nThe linker sees two external definitions with the same name and cannot select a unique implementation. This is not an algorithm defect.\n\nStep 3 | Separate interface from implementation\nutil.h should declare int clamp(int,int,int); for call checking, while util.c supplies the single function body.\n\nStep 4 | Check build inputs\nutil.c must be compiled and linked with a.o and b.o. Otherwise “multiple definition” merely becomes “undefined reference”.\n\nStep 5 | Conclude\nChoose C. A carefully designed static inline header function is a different linkage model; deleting guards or copying definitions is not the repair.",
    ),
    rubric: {
      zh: ["1 分：guard 的翻译单元范围", "1 分：解释外部链接", "2 分：接口/实现分离", "1 分：正确链接 util.o", "1 分：排除复制方案"],
      en: ["1: translation-unit scope of guards", "1: explain external linkage", "2: interface/implementation split", "1: link util.o", "1: reject duplication"],
    },
  },
  {
    id: "c-6-difficulty-02",
    courseId: "c",
    topicId: "c-6",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "single-choice",
    cognitiveRole: "transfer",
    estimatedMinutes: 7,
    answerTools: ["code-draft"],
    question: b(
      "函数 parse_percent 接收字符串，只接受十进制整数 0–100。哪组测试最有能力同时发现下界、上界、off-by-one 和格式验证错误？",
      "parse_percent accepts a string representing a decimal integer from 0 to 100 only. Which test set best exposes lower-bound, upper-bound, off-by-one and format-validation faults together?",
    ),
    options: [
      b('{"50"}', '{"50"}'),
      b('{"0","100"}', '{"0","100"}'),
      b('{"1","50","99"}', '{"1","50","99"}'),
      b('{"-1","0","1","99","100","101","12x",""}', '{"-1","0","1","99","100","101","12x",""}'),
    ],
    answer: 3,
    visual: {
      kind: "table",
      title: b("输入域分区", "Input-domain partitions"),
      columns: [b("分区", "Partition"), b("代表值", "Representative")],
      rows: [
        ["below minimum", "-1"],
        ["lower boundary / neighbour", "0, 1"],
        ["upper neighbour / boundary / above", "99, 100, 101"],
        ["malformed / empty", "12x, empty"],
      ],
    },
    explanation: b(
      "第 1 步｜从规格派生分区\n有效域是闭区间 [0,100]，所以至少要覆盖低于下界、两个边界、区间内部和高于上界。\n\n第 2 步｜专门攻击 off-by-one\n成对使用 -1/0/1 与 99/100/101，可区分 <、<=、>、>= 写错造成的边界缺陷。\n\n第 3 步｜覆盖格式层\n参数是字符串，数值范围测试不能发现把 \"12x\" 部分解析为 12 或把空字符串当 0 的错误；必须加入畸形和空输入。\n\n第 4 步｜比较候选集\nA–C 只有有效输入，即使实现错误地接受所有无效输入也可能全部通过；D 覆盖所有关键等价类和邻界值。\n\n第 5 步｜结论\n选择 D。高质量测试来自接口规格和失败模式，而不是随便堆很多普通值。",
      "Step 1 | Derive partitions from the specification\nThe valid domain is closed interval [0,100]. Cover below minimum, both boundaries, an interior value and above maximum.\n\nStep 2 | Attack off-by-one errors\nPairs -1/0/1 and 99/100/101 distinguish incorrect uses of <, <=, > and >= at both boundaries.\n\nStep 3 | Cover the format layer\nThe input is text. Range-only tests cannot catch accepting \"12x\" as 12 or an empty string as zero; malformed and empty inputs are required.\n\nStep 4 | Compare candidates\nA–C contain only valid values, so an implementation that wrongly accepts every invalid string may still pass. D covers all critical partitions and neighbouring boundaries.\n\nStep 5 | Conclude\nChoose D. Strong tests derive from the contract and failure modes, not from accumulating ordinary values.",
    ),
    rubric: {
      zh: ["1 分：有效域分区", "2 分：双侧邻界值", "1 分：畸形字符串", "1 分：空字符串", "1 分：说明测试可检出的错误"],
      en: ["1: valid-domain partitioning", "2: neighbours on both boundaries", "1: malformed string", "1: empty string", "1: explain detectable faults"],
    },
  },
  {
    id: "c-6-difficulty-03",
    courseId: "c",
    topicId: "c-6",
    kind: "combination",
    difficulty: "instructor",
    responseMode: "multi-select",
    cognitiveRole: "definition-boundary",
    estimatedMinutes: 8,
    answerTools: ["code-draft"],
    question: b(
      "多选组合：关于多文件 C 项目的模块边界，选择所有正确做法。",
      "Multiple-select combination: choose every sound practice for module boundaries in a multi-file C project.",
    ),
    options: [
      b("公共头文件使用 include guard，并声明稳定的公共接口", "A public header uses an include guard and declares the stable public interface"),
      b("在头文件中定义 static 状态，就能让所有 .c 文件共享同一个实例", "Defining static state in a header makes every .c file share one instance"),
      b("让其他模块 #include 某个 .c 文件，是复用实现的首选方式", "Having modules #include a .c file is the preferred way to reuse an implementation"),
      b("共享全局对象可在头文件中 extern 声明，并在恰好一个 .c 文件中定义", "A shared global may be declared extern in a header and defined in exactly one .c file"),
    ],
    answer: [0, 3],
    visual: {
      kind: "table",
      title: b("模块文件职责", "Module file responsibilities"),
      columns: [b("文件", "File"), b("主要职责", "Primary responsibility")],
      rows: [
        ["module.h", "public declarations and types"],
        ["module.c", "one implementation and private state"],
        ["tests/module_test.c", "observable contract tests"],
      ],
    },
    explanation: b(
      "第 1 步｜评估头文件职责\n头文件声明调用者需要的类型和函数，guard 防止同一翻译单元重复包含，因此 A 正确。\n\n第 2 步｜分析头文件中的 static 状态\nstatic 赋予内部链接；头文件被多个 .c 展开时，每个翻译单元各有一份独立状态，不是全项目共享，所以 B 错。\n\n第 3 步｜拒绝包含实现文件\n#include .c 会混淆翻译单元边界并容易导致重复定义；正常做法是分别编译再链接，C 错。\n\n第 4 步｜核对 extern 模式\n头文件的 extern 是声明，不分配对象；恰好一个 .c 中的非 extern 定义提供存储，因此 D 正确。\n\n第 5 步｜结论\n选择 A、D。即使 extern 合法，也应优先问这个全局状态能否隐藏在模块后面，通过函数接口访问。",
      "Step 1 | Evaluate header responsibility\nA header declares the types and functions callers need; a guard prevents repeated inclusion in one translation unit. A is correct.\n\nStep 2 | Analyse static state in a header\nstatic gives internal linkage. When several .c files expand that header, each translation unit receives its own state, not one project-wide instance. B is false.\n\nStep 3 | Reject including implementation files\n#include of a .c file blurs translation-unit boundaries and invites multiple definitions. Implementations should be compiled separately and linked, so C is false.\n\nStep 4 | Verify the extern pattern\nextern in the header is a declaration and allocates no object. Exactly one non-extern definition in a .c file supplies storage. D is correct.\n\nStep 5 | Conclude\nSelect A and D. Even when extern is legal, consider hiding the state behind a functional module interface.",
    ),
    rubric: {
      zh: ["1 分：guard 与公共接口", "1 分：static 内部链接", "1 分：每个翻译单元一份状态", "1 分：拒绝 include .c", "1 分：extern 声明/唯一定义", "1 分：只选 A、D"],
      en: ["1: guard and public interface", "1: static internal linkage", "1: one state per translation unit", "1: reject including .c", "1: extern declaration/one definition", "1: select A and D only"],
    },
  },
  {
    id: "c-7-difficulty-01",
    courseId: "c",
    topicId: "c-7",
    kind: "data",
    difficulty: "instructor",
    responseMode: "worked-response",
    cognitiveRole: "multi-step-calculation",
    estimatedMinutes: 6,
    answerTools: ["code-draft"],
    question: b(
      "假设程序以命令 ./scale 3 4 启动。它输出什么？",
      "Assume the program is launched as ./scale 3 4. What does it print?",
    ),
    options: [b("3 7", "3 7"), b("2 7", "2 7"), b("3 34", "3 34"), b("2 34", "2 34")],
    answer: 0,
    visual: {
      kind: "code",
      title: b("命令行参数追踪", "Command-line trace"),
      code: `#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    int sum = 0;
    for (int i = 1; i < argc; ++i) {
        sum += atoi(argv[i]);
    }
    printf("%d %d\\n", argc, sum);
    return 0;
}`,
    },
    explanation: b(
      "第 1 步｜列出 argv\nargv[0] 通常是 \"./scale\"，argv[1] 是 \"3\"，argv[2] 是 \"4\"，随后 argv[3] 为 NULL。\n\n第 2 步｜确定 argc\nargc 计入程序名，因此共有 3 个参数字符串，argc=3，而不是仅数用户输入的两个数字。\n\n第 3 步｜追踪循环边界\n循环从 i=1 开始，故跳过程序名；i=1、2 两次迭代分别把 atoi 的 3 和 4 加入 sum。\n\n第 4 步｜计算输出\nsum=0+3+4=7，printf 依次输出 argc 和 sum，即 3 7。\n\n第 5 步｜指出接口局限\n本题输入有效，所以 atoi 可得到数值；真实校验不应依赖 atoi，因为它无法可靠区分 \"0\" 与转换失败。故选 A。",
      "Step 1 | List argv\nargv[0] is normally \"./scale\", argv[1] is \"3\", argv[2] is \"4\", and argv[3] is the null sentinel.\n\nStep 2 | Determine argc\nargc includes the program name, so there are three argument strings. argc=3, not merely the two user-entered numbers.\n\nStep 3 | Trace the loop boundary\nThe loop starts at i=1 and skips the program name. Iterations i=1 and i=2 add atoi results 3 and 4.\n\nStep 4 | Calculate the output\nsum=0+3+4=7. printf outputs argc then sum: 3 7.\n\nStep 5 | State the interface limitation\nThe inputs here are valid, but real validation should not rely on atoi because it cannot reliably distinguish \"0\" from failed conversion. Choose A.",
    ),
    rubric: {
      zh: ["1 分：列出 argv", "1 分：argc 包含程序名", "1 分：循环从 1 开始", "1 分：求和为 7", "1 分：说明 atoi 局限"],
      en: ["1: list argv", "1: argc includes program name", "1: loop starts at 1", "1: sum is 7", "1: state atoi limitation"],
    },
  },
  {
    id: "c-7-difficulty-02",
    courseId: "c",
    topicId: "c-7",
    kind: "scenario",
    difficulty: "instructor",
    responseMode: "error-analysis",
    cognitiveRole: "definition-boundary",
    estimatedMinutes: 10,
    answerTools: ["code-draft"],
    question: b(
      "程序要把 argv[1] 完整转换为 int，拒绝空串、尾随字符、溢出和超出 int 范围。哪一项给出的检查最完整？（假设已令 errno=0，并执行 long v=strtol(argv[1],&end,10)。）",
      "The program must convert all of argv[1] to int, rejecting empty input, trailing characters, overflow and values outside int range. Which check is most complete? (Assume errno=0 and long v=strtol(argv[1],&end,10) have run.)",
    ),
    options: [
      b("if(v==0) error();", "if(v==0) error();"),
      b("if(end==argv[1] || *end!='\\0' || errno==ERANGE || v<INT_MIN || v>INT_MAX) error();", "if(end==argv[1] || *end!='\\0' || errno==ERANGE || v<INT_MIN || v>INT_MAX) error();"),
      b("if(*end=='\\0') error();", "if(*end=='\\0') error();"),
      b("if(argc>1) v=atoi(argv[1]);", "if(argc>1) v=atoi(argv[1]);"),
    ],
    answer: 1,
    visual: {
      kind: "code",
      title: b("strtol 转换上下文", "strtol conversion context"),
      code: `if (argc != 2) return EXIT_FAILURE;
errno = 0;
char *end = NULL;
long v = strtol(argv[1], &end, 10);
/* choose the complete validation condition */
int result = (int)v;`,
    },
    explanation: b(
      "第 1 步｜确认至少转换了一个字符\n若 end==argv[1]，解析指针没有前进，说明输入为空或开头就不是数字；必须拒绝。\n\n第 2 步｜要求消费完整字符串\n成功解析数字前缀还不够。*end 必须是 '\\0'，否则 \"12x\" 会被错误接受为 12。\n\n第 3 步｜检查 strtol 自身范围\n当结果超出 long 范围时，strtol 通过 errno==ERANGE 报告；调用前清零 errno 才能把它归因于本次调用。\n\n第 4 步｜检查目标类型范围\n即使值适合 long，也可能不适合 int。强制转换前必须验证 INT_MIN<=v<=INT_MAX。\n\n第 5 步｜结论\nB 同时覆盖无数字、尾随字符、long 溢出和 int 缩窄范围，故选 B；数值 0 本身是完全合法的输入，不能拿 v==0 当失败标志。",
      "Step 1 | Confirm that at least one character converted\nIf end==argv[1], the parse pointer did not advance: the string was empty or began with no number. Reject it.\n\nStep 2 | Require the whole string\nA valid numeric prefix is insufficient. *end must be '\\0', otherwise \"12x\" would be wrongly accepted as 12.\n\nStep 3 | Check strtol's own range\nIf the result is outside long range, strtol reports errno==ERANGE. Clearing errno first associates that flag with this call.\n\nStep 4 | Check the target type's range\nA value may fit long but not int. Verify INT_MIN<=v<=INT_MAX before narrowing.\n\nStep 5 | Conclude\nB covers no digits, trailing text, long overflow and int range, so choose B. Zero is a valid value and cannot serve as a generic failure signal.",
    ),
    rubric: {
      zh: ["1 分：end==起点", "1 分：完整消费字符串", "1 分：errno/ERANGE", "1 分：int 范围", "1 分：转换前检查", "1 分：0 可为合法值"],
      en: ["1: end equals start", "1: consume the full string", "1: errno/ERANGE", "1: int range", "1: check before conversion", "1: zero can be valid"],
    },
  },
  {
    id: "c-7-difficulty-03",
    courseId: "c",
    topicId: "c-7",
    kind: "multiple",
    difficulty: "instructor",
    responseMode: "multi-select",
    cognitiveRole: "transfer",
    estimatedMinutes: 8,
    answerTools: ["code-draft"],
    question: b(
      "多选：为一个支持选项和位置参数的命令行程序做可靠解析时，哪些做法正确？",
      "Multiple select: which practices are sound when parsing a command line with options and positional arguments?",
    ),
    options: [
      b("读取 argv[2] 前先证明 argc>=3", "Establish argc>=3 before reading argv[2]"),
      b("atoi 能通过 end 指针精确报告第一个无效字符", "atoi reports the first invalid character through an end pointer"),
      b("若接口约定支持 --，解析器可把它当作选项结束标记", "If specified by the interface, the parser may treat -- as the end-of-options marker"),
      b("检测到用法错误时返回 EXIT_FAILURE，可向调用脚本传递失败状态", "Returning EXIT_FAILURE on a usage error communicates failure to a calling script"),
    ],
    answer: [0, 2, 3],
    visual: {
      kind: "table",
      title: b("示例调用的标记序列", "Token sequence in an example invocation"),
      columns: [b("索引", "Index"), b("值", "Value"), b("可能角色", "Possible role")],
      rows: [
        ["argv[0]", "./report", "program name"],
        ["argv[1]", "-v", "option"],
        ["argv[2]", "--", "end of options"],
        ["argv[3]", "-data.txt", "positional filename"],
      ],
    },
    explanation: b(
      "第 1 步｜先证明索引存在\nargv 的有效字符串索引是 0 到 argc-1；读取 argv[2] 前必须有 argc>=3，所以 A 正确。\n\n第 2 步｜比较数值转换接口\natoi 没有 end 指针，也没有可靠错误报告；需要诊断完整输入时应使用 strtol 等接口，因此 B 错。\n\n第 3 步｜按已声明的命令行语法处理 --\n若程序接口约定 -- 结束选项，那么它之后以 '-' 开头的字符串也作为位置参数；C 正确。该行为来自接口约定，不是 C 语言自动完成。\n\n第 4 步｜设计可观察的失败\nEXIT_FAILURE 是向操作系统返回失败状态的可移植宏；脚本和测试可据此区分成功输出与用法错误，所以 D 正确。\n\n第 5 步｜结论\n选择 A、C、D。可靠解析同时处理数量、语法、转换、范围、错误信息与进程返回码。",
      "Step 1 | Prove the index exists\nValid argument-string indices are 0 through argc-1. Reading argv[2] requires argc>=3, so A is correct.\n\nStep 2 | Compare numeric-conversion APIs\natoi has no end pointer and no reliable error reporting. Use strtol or a similar interface for complete validation, so B is false.\n\nStep 3 | Apply the declared -- grammar\nIf the program's interface specifies -- as end-of-options, later strings beginning with '-' are positional arguments. C is correct; C itself does not parse this automatically.\n\nStep 4 | Make failure observable\nEXIT_FAILURE portably reports failure to the operating system. Scripts and tests can distinguish a usage error from successful output, so D is correct.\n\nStep 5 | Conclude\nSelect A, C and D. Robust parsing covers count, grammar, conversion, range, diagnostics and process status.",
    ),
    rubric: {
      zh: ["1 分：argc 边界", "1 分：atoi 局限", "1 分：-- 的接口语义", "1 分：EXIT_FAILURE", "1 分：选择 A、C、D", "1 分：说明完整验证层次"],
      en: ["1: argc boundary", "1: atoi limitation", "1: interface meaning of --", "1: EXIT_FAILURE", "1: select A, C and D", "1: describe complete validation layers"],
    },
  },
];

const transferTasks: Record<string, ReturnType<typeof b>> = {
  "c-0-difficulty-01": b(
    "把表达式中的 (double)(a/d) 改成 (double)a/d，并把 a 改为 8。先预测两项各自的类型和最终一位小数输出，再独立逐行重算；最后说明转换放在除法前后为何会改变结果。",
    "Move the cast from (double)(a/d) to (double)a/d and change a to 8. Predict each term's type and the one-decimal output, then rework the trace independently; finish by explaining why casting before rather than after division changes the result.",
  ),
  "c-0-difficulty-02": b(
    "分别以 -1、0、130、131 和非数字 12x 作为输入，逐个预测 scanf 返回值、短路条件走向和程序返回码；再写出一个表格，证明两个合法边界被接受而其相邻无效值被拒绝。",
    "Use -1, 0, 130, 131 and non-numeric 12x as separate inputs. Predict scanf's return, the short-circuit path and process status for each, then make a table proving that both valid boundaries are accepted while their invalid neighbours are rejected.",
  ),
  "c-0-difficulty-03": b(
    "新建 area.c 并加入函数定义，先预测“只编译 main.c”“分别编译但漏链 area.o”“正确链接两个目标文件”三种构建结果，再独立写出每个阶段产生或缺少的符号。",
    "Add an area definition in area.c. Predict the outcomes for compiling only main.c, compiling both but omitting area.o from the link, and linking both objects correctly; then independently identify the symbol produced or missing at each stage.",
  ),
  "c-1-difficulty-01": b(
    "依次尝试两种修改：仅把 half 的返回类型改为 double；再把函数体改为 return (double)x/2。对 x=7 分别预测输出并重算，说明“返回类型”和“运算发生时的操作数类型”不是同一件事。",
    "Try two changes in turn: change only half's return type to double, then change its body to return (double)x/2. For x=7, predict and recompute both outputs, explaining why a return type and the operand types at the moment of division are different issues.",
  ),
  "c-1-difficulty-02": b(
    "为 mean 明确制定 a==NULL、n==0、a==NULL 且 n==0 三种情况的接口契约。先预测原接口能否安全处理，再选择“状态码+输出参数”或约定特殊返回值的方案并写两个边界测试。",
    "Define an explicit contract for mean when a==NULL, n==0, and both hold. Predict whether the original interface can handle each safely, then choose either a status-plus-output design or a documented special result and write two boundary tests.",
  ),
  "c-1-difficulty-03": b(
    "分别用 total=-5,count=2,out 有效，以及 total=8,count=0,out 有效，再用 out=NULL 调用。先预测状态码和 out 是否允许读取，再独立追踪到每个 return，检查没有任何失败路径执行除法或解引用。",
    "Call the function with total=-5,count=2 and valid out; with total=8,count=0; and with out=NULL. Predict the status and whether out may be read, then trace each return independently and verify that no failure path divides or dereferences.",
  ),
  "c-2-difficulty-01": b(
    "把 continue 条件改成 i%2!=0，使内层循环只处理偶数 i。先列出会进入内层的 i 和每个 j，再独立计算新 s；最后用一张迭代表检查是否遗漏 i=4 或误包含 j=i。",
    "Change the continue condition to i%2!=0 so only even i values reach the inner loop. List every surviving i and j before recomputing s independently, then audit an iteration table for a missed i=4 or an incorrectly included j=i.",
  ),
  "c-2-difficulty-02": b(
    "对数组 {2,4,4,9} 分别用 key=4 和 key=10 运行算法。先预测返回下标，再逐轮记录 lo、mid、hi；最后分别判断“返回位置有效”和“该位置可立即解引用”是否成立。",
    "Run the algorithm on {2,4,4,9} with key=4 and key=10. Predict each returned index, then record lo, mid and hi on every iteration; finally judge separately whether the returned position is meaningful and whether it may immediately be dereferenced.",
  ),
  "c-2-difficulty-03": b(
    "保持代码不变，分别令 x=1 和 x=3，先预测进入标签及所有穿透路径，再独立求 y；随后在每个 case 后都加 break，重做三种 x 值并比较控制流。",
    "Keep the code unchanged and set x to 1 and then 3. Predict the entry label and every fall-through path before recomputing y; then add a break after every case, redo all three x values and compare the control flow.",
  ),
  "c-3-difficulty-01": b(
    "把数组改为 char s[6]=\"abcd\"，再分别执行 s[4]='X' 与 s[5]='X'。在每种情况下先画出 6 个字节，再预测 strlen 和 %s 是否有定义，最后通过补回 '\\0' 独立修复。",
    "Change the declaration to char s[6]=\"abcd\", then separately execute s[4]='X' and s[5]='X'. Draw all six bytes before predicting whether strlen and %s are defined in each case, then independently repair the array by restoring a '\\0'.",
  ),
  "c-3-difficulty-02": b(
    "把数据改为一维数组 {2,4,6,8,10,12}，令 p=a+2，并计算 p[-2]+*(p+3)。先预测两个目标下标，再重算结果；随后把 p+3 改成 p+4，判断“形成指针”和“解引用指针”各自的边界。",
    "Use a one-dimensional array {2,4,6,8,10,12}, set p=a+2, and evaluate p[-2]+*(p+3). Predict both target indices before recomputing; then change p+3 to p+4 and distinguish the boundary for forming a pointer from the boundary for dereferencing it.",
  ),
  "c-3-difficulty-03": b(
    "分别模拟输入只有换行、恰好填满缓冲区而没有换行、普通短行三种情况。先写出 buf 的末尾字节和 n，再预测条件是否修改数组，最后独立写测试证明非换行字符不会被删除。",
    "Simulate an input containing only a newline, one that fills the buffer without a newline, and an ordinary short line. Write the final bytes and n before predicting whether the guard edits the array, then independently write tests proving a non-newline character is preserved.",
  ),
  "c-4-difficulty-01": b(
    "把 shift 改为接收 Point *p，但只执行 p->x+=10。先预测调用 shift(&p) 后两个成员，再独立追踪地址、对象和成员变化；最后加入 NULL 输入并设计一个不解引用的失败策略。",
    "Change shift to accept Point *p but modify only p->x+=10. Predict both members after shift(&p), then independently trace the address, object and member change; finally add a NULL call and design a failure strategy that performs no dereference.",
  ),
  "c-4-difficulty-02": b(
    "令文件内容为 3 5 x 4。先预测使用 fscanf==1 的循环累加到哪里、最终 sum 和失败时文件位置，再独立增加错误分支以区分格式错误与正常 EOF。",
    "Use file contents 3 5 x 4. Predict where the fscanf==1 loop stops, the final sum and the stream position on failure, then independently add a branch that distinguishes malformed input from normal EOF.",
  ),
  "c-4-difficulty-03": b(
    "给 Student 增加一个字段并假设旧文件仍含上一版本记录。先预测 raw fwrite 方案可能出现的布局问题，再独立设计包含版本号和逐字段编码的文本或二进制格式，并列出两项兼容性检查。",
    "Add a field to Student while an old file still contains the previous record version. Predict the layout failures possible with raw fwrite, then independently design a versioned field-by-field text or binary format and list two compatibility checks.",
  ),
  "c-5-difficulty-01": b(
    "改令 p=a+2，并计算 *p 与 p[-2]+p[1]。先标出每个地址对应的下标，再独立计算；随后尝试 p[-3]，分别判断该指针运算和解引用是否仍在同一数组边界内。",
    "Set p=a+2 and evaluate *p and p[-2]+p[1]. Mark the index reached by each address before recomputing, then try p[-3] and separately judge whether the pointer operation and dereference stay within the same array bounds.",
  ),
  "c-5-difficulty-02": b(
    "分别模拟 realloc 成功且地址改变、成功且地址不变、失败三条路径。先画出 p、tmp 与分配块的关系，再独立写出每条路径最终允许使用和必须 free 的唯一指针。",
    "Simulate three paths: realloc succeeds and moves the block, succeeds without moving it, and fails. Draw p, tmp and the allocation before independently naming the only pointer that may be used and eventually freed on each path.",
  ),
  "c-5-difficulty-03": b(
    "先把 q 设为 NULL 再 free(p)，与先 free(p) 再把 p 设为 NULL 两种顺序比较。预测每一步哪些变量是有效、空或悬空，再独立制定“单一所有者”版本并说明为何不会 double free。",
    "Compare setting q=NULL before free(p) with freeing p and then setting p=NULL. Predict after every step which variables are valid, null or dangling, then independently redesign it with a single owner and explain why double free becomes impossible.",
  ),
  "c-6-difficulty-01": b(
    "增加第三个 client.c，并分别测试“头文件声明+util.c 唯一定义”和“头文件 static inline 定义”两种结构。先预测每个翻译单元产生的符号，再独立说明两种方案的链接与代码副本差异。",
    "Add a third client.c and compare a header declaration plus one util.c definition with a static inline header definition. Predict the symbols produced by each translation unit, then independently explain their linkage and code-copy differences.",
  ),
  "c-6-difficulty-02": b(
    "把规格改为只接受 1–99 且允许前导加号。先不看原答案，重新按等价类和邻界值推导最小测试集；再加入 +1、+99、+100，预测解析层与范围层各自应接受或拒绝。",
    "Change the contract to accept only 1–99 while allowing a leading plus sign. Without reusing the old answer, derive a minimal set from partitions and neighbours; add +1, +99 and +100 and predict acceptance separately at the parsing and range layers.",
  ),
  "c-6-difficulty-03": b(
    "把共享全局改为 module.c 中的 static 私有状态，并通过 get/set 函数访问。先预测其他 .c 直接 extern 该名字时的链接结果，再独立写出头文件接口和一个验证封装边界的测试。",
    "Move the shared global to static private state in module.c and expose get/set functions. Predict the link result if another .c tries to extern the private name, then independently write the header interface and one test of the encapsulation boundary.",
  ),
  "c-7-difficulty-01": b(
    "分别以 ./scale、./scale 3 x 和 ./scale -2 5 启动当前程序。先列出 argc/argv 并预测现有 atoi 版本的输出，再独立改用完整验证，让三次调用得到明确且可测试的成功或失败状态。",
    "Run the current program as ./scale, ./scale 3 x and ./scale -2 5. List argc/argv and predict atoi-based output first, then independently replace it with complete validation so each invocation has an explicit testable success or failure status.",
  ),
  "c-7-difficulty-02": b(
    "用空串、0、12x、超过 long 的数字、以及刚好比 INT_MAX 大 1 的数字逐个走验证条件。先预测 end、errno 和范围判断，再独立说明是哪一层拒绝每个无效输入。",
    "Walk an empty string, 0, 12x, a value beyond long, and INT_MAX+1 through the validation condition. Predict end, errno and the range test before independently identifying the exact layer that rejects each invalid input.",
  ),
  "c-7-difficulty-03": b(
    "按接口约定解析 ./report -v -- -data.txt，再移除最后的位置参数重做。先标注每个 argv 的角色和索引，再独立预测成功路径、缺参错误信息与 EXIT_FAILURE 返回。",
    "Parse ./report -v -- -data.txt under the stated interface, then repeat after removing the final positional argument. Label every argv role and index before independently predicting the success path, missing-argument diagnostic and EXIT_FAILURE result.",
  ),
};

export const cDifficultyQuestionBank: InstructorQuestion[] =
  authoredCDifficultyQuestionBank.map((question) => {
    const transfer = transferTasks[question.id];
    if (!transfer) {
      throw new Error(`Missing transfer task for ${question.id}`);
    }
    return {
      ...question,
      explanation: b(
        `${question.explanation.zh}\n\n迁移练习\n${transfer.zh}`,
        `${question.explanation.en}\n\nTransfer practice\n${transfer.en}`,
      ),
    };
  });
