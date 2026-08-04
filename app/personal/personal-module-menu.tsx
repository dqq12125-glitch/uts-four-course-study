"use client";

import { useEffect, useRef } from "react";

export type PersonalView = "today" | "plan" | "courses" | "tutor" | "quiz";
export type PlanModule = "weekly" | "timetable" | "assessments" | "widget";
export type CourseModule = "math" | "eee" | "c" | "physics";
export type PersonalDestinationId =
  | "today"
  | "plan-weekly"
  | "plan-timetable"
  | "plan-assessments"
  | "plan-widget"
  | "course-math"
  | "course-eee"
  | "course-c"
  | "course-physics"
  | "tutor"
  | "quiz";

type Lang = "zh" | "en";
type MainModuleId = "overview" | "planning" | "courses" | "mastery";

export type PersonalNavigationIconName =
  | "today"
  | "plan"
  | "courses"
  | "tutor"
  | "menu"
  | "close";

export function PersonalNavigationIcon({
  name,
}: {
  name: PersonalNavigationIconName;
}) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "today") {
    return (
      <svg {...common}>
        <path d="M5 3v3M19 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
        <path d="m9 14 2 2 4-5" />
      </svg>
    );
  }
  if (name === "plan") {
    return (
      <svg {...common}>
        <path d="M7 3v3M17 3v3M4 8h16v12H4z" />
        <path d="m8 14 2 2 5-5" />
      </svg>
    );
  }
  if (name === "courses") {
    return (
      <svg {...common}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
        <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7h7" />
      </svg>
    );
  }
  if (name === "tutor") {
    return (
      <svg {...common}>
        <path d="M4 5h16v12H9l-5 4V5Z" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    );
  }
  if (name === "close") {
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  );
}

type Destination = {
  id: PersonalDestinationId;
  label: string;
  description: string;
  shortLabel: string;
  view: PersonalView;
};

type ModuleGroup = {
  id: MainModuleId;
  index: string;
  label: string;
  description: string;
  destinations: Destination[];
};

export function personalModuleGroups(lang: Lang): ModuleGroup[] {
  const zh = lang === "zh";
  return [
    {
      id: "overview",
      index: "01",
      label: zh ? "今日总览" : "Today",
      description: zh ? "先看现在最该完成的事" : "Start with the most important next action",
      destinations: [
        {
          id: "today",
          label: zh ? "今日学习" : "Today’s study",
          shortLabel: zh ? "今日" : "Today",
          description: zh ? "任务队列、专注计时与今日课程" : "Task queue, focus timer and today’s classes",
          view: "today",
        },
      ],
    },
    {
      id: "planning",
      index: "02",
      label: zh ? "学习规划" : "Study planning",
      description: zh ? "把时间、课程与截止日期分开管理" : "Manage time, classes and deadlines separately",
      destinations: [
        {
          id: "plan-weekly",
          label: zh ? "本周学习" : "Weekly study",
          shortLabel: zh ? "本周" : "Week",
          description: zh ? "课前预习、课后复习与闭卷检查" : "Preparation, review and retrieval",
          view: "plan",
        },
        {
          id: "plan-timetable",
          label: zh ? "课程表" : "Timetable",
          shortLabel: zh ? "课表" : "Timetable",
          description: zh ? "上课时间、课室、Zoom 与可选时段" : "Times, rooms, Zoom and selectable slots",
          view: "plan",
        },
        {
          id: "plan-assessments",
          label: zh ? "作业与考试" : "Assessments",
          shortLabel: zh ? "截止" : "Due",
          description: zh ? "作业与考试的截止日期与当前行动" : "Deadlines and the next action for each task",
          view: "plan",
        },
        {
          id: "plan-widget",
          label: zh ? "iOS 课表组件" : "iOS widget",
          shortLabel: zh ? "组件" : "Widget",
          description: zh ? "安装或更新桌面课表组件" : "Install or update the Home Screen widget",
          view: "plan",
        },
      ],
    },
    {
      id: "courses",
      index: "03",
      label: zh ? "课程学习" : "Course learning",
      description: zh ? "按课程进入章节、例题与学习工具" : "Open chapters, examples and tools by course",
      destinations: [
        {
          id: "course-math",
          label: zh ? "33130 · 数学 1" : "33130 · Mathematics 1",
          shortLabel: "33130",
          description: zh ? "向量、矩阵与微积分建模" : "Vectors, matrices and calculus modelling",
          view: "courses",
        },
        {
          id: "course-eee",
          label: zh ? "48510 · 电气与电子" : "48510 · Electrical and electronic",
          shortLabel: "48510",
          description: zh ? "电路、KCL/KVL 与电子系统" : "Circuits, KCL/KVL and electronic systems",
          view: "courses",
        },
        {
          id: "course-c",
          label: zh ? "48430 · C 编程" : "48430 · C programming",
          shortLabel: "48430",
          description: zh ? "程序结构、数组、指针与调试" : "Program structure, arrays, pointers and debugging",
          view: "courses",
        },
        {
          id: "course-physics",
          label: zh ? "68037 · 物理" : "68037 · Physics",
          shortLabel: "68037",
          description: zh ? "力学、波动、实验与数据分析" : "Mechanics, waves, experiments and data analysis",
          view: "courses",
        },
      ],
    },
    {
      id: "mastery",
      index: "04",
      label: zh ? "深度掌握" : "Deep mastery",
      description: zh ? "先理解，再练习，直到可以独立解释" : "Understand, practise and explain independently",
      destinations: [
        {
          id: "tutor",
          label: zh ? "AI 深度导师" : "AI deep tutor",
          shortLabel: zh ? "AI 导师" : "AI Tutor",
          description: zh ? "苏格拉底追问、分层提示与迁移题" : "Socratic questions, layered hints and transfer tasks",
          view: "tutor",
        },
        {
          id: "quiz",
          label: zh ? "练习与题库" : "Practice bank",
          shortLabel: zh ? "练习" : "Practice",
          description: zh ? "按难度、课程和掌握状态刷题" : "Practise by difficulty, course and mastery status",
          view: "quiz",
        },
      ],
    },
  ];
}

export function mainModuleForDestination(
  id: PersonalDestinationId,
): MainModuleId {
  if (id === "today") return "overview";
  if (id.startsWith("plan-")) return "planning";
  if (id.startsWith("course-")) return "courses";
  return "mastery";
}

type MenuProps = {
  lang: Lang;
  open: boolean;
  activeId: PersonalDestinationId;
  onClose: () => void;
  onNavigate: (id: PersonalDestinationId) => void;
};

export function PersonalModuleMenu({
  lang,
  open,
  activeId,
  onClose,
  onNavigate,
}: MenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const groups = personalModuleGroups(lang);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="module-menu-dialog"
      aria-labelledby="module-menu-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="module-menu-shell">
        <header className="module-menu-header">
          <div>
            <p>{lang === "zh" ? "全部板块" : "ALL MODULES"}</p>
            <h2 id="module-menu-title">{lang === "zh" ? "学习菜单" : "Study menu"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={lang === "zh" ? "关闭菜单" : "Close menu"}>
            <PersonalNavigationIcon name="close" />
          </button>
        </header>

        <div className="module-menu-groups">
          {groups.map((group) => (
            <section className="module-menu-group" key={group.id} aria-labelledby={`module-group-${group.id}`}>
              <header>
                <span>{group.index}</span>
                <div>
                  <h3 id={`module-group-${group.id}`}>{group.label}</h3>
                  <p>{group.description}</p>
                </div>
              </header>
              <div className="module-menu-items">
                {group.destinations.map((destination) => (
                  <button
                    type="button"
                    key={destination.id}
                    className={destination.id === activeId ? "active" : ""}
                    aria-current={destination.id === activeId ? "page" : undefined}
                    onClick={() => onNavigate(destination.id)}
                  >
                    <span className="module-menu-item-mark" aria-hidden="true" />
                    <span>
                      <strong>{destination.label}</strong>
                      <small>{destination.description}</small>
                    </span>
                    <b aria-hidden="true">→</b>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  );
}

type ContextBarProps = {
  lang: Lang;
  activeId: PersonalDestinationId;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onNavigate: (id: PersonalDestinationId) => void;
};

export function ModuleContextBar({
  lang,
  activeId,
  menuOpen,
  onOpenMenu,
  onNavigate,
}: ContextBarProps) {
  const groups = personalModuleGroups(lang);
  const activeGroup = groups.find((group) =>
    group.destinations.some((destination) => destination.id === activeId),
  ) ?? groups[0];
  const activeDestination = activeGroup.destinations.find(
    (destination) => destination.id === activeId,
  ) ?? activeGroup.destinations[0];

  return (
    <section className="module-context-bar" aria-label={lang === "zh" ? "当前学习板块" : "Current study module"}>
      <div className="module-context-current">
        <div className="module-breadcrumb">
          <small>{activeGroup.label}</small>
          <strong>{activeDestination.label}</strong>
        </div>
        <button
          type="button"
          className="module-menu-trigger"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
        >
          <PersonalNavigationIcon name="menu" />
          {lang === "zh" ? "菜单" : "Menu"}
        </button>
      </div>

      {activeGroup.destinations.length > 1 && (
        <nav className="module-subnav" aria-label={lang === "zh" ? `${activeGroup.label}子版块` : `${activeGroup.label} sections`}>
          {activeGroup.destinations.map((destination) => (
            <button
              type="button"
              key={destination.id}
              className={destination.id === activeId ? "active" : ""}
              aria-current={destination.id === activeId ? "page" : undefined}
              onClick={() => onNavigate(destination.id)}
            >
              {destination.shortLabel}
            </button>
          ))}
        </nav>
      )}
    </section>
  );
}
