export interface Project {
  name: string;
  slug: string;
  repo: string;
  description: string;
  tags: string[];
  link: string;
  demo?: string;
  status: 'active' | 'maintained' | 'archived';
  date: string;
  published: string;
}

export const PROJECTS: Project[] = [
  {
    name: 'EP小车导航',
    slug: 'ep-navigation',
    repo: 'EP_navigation_Ros1',
    description: 'RobotMaster EP实现自主导航（SLAM建图 + 路径规划）',
    tags: ['ROS', 'RoboMaster EP', 'SLAM', 'Navigation', 'C++'],
    link: 'https://github.com/learnerCodeZ/EP_navigation_Ros1',
    status: 'maintained',
    date: '2026-07-06',
    published: '2026-08-02',
  },
  {
    name: 'Exam Prep Ultra',
    slug: 'exam-prep-ultra',
    repo: 'exam-prep-ultra',
    description: '全栈刷题 App，导入 Word/Markdown/PDF 题库即选即判，含用户系统与好友共享（Cloudflare D1+KV+Pages）',
    tags: ['Cloudflare Pages', 'D1', 'KV', '全栈', 'JavaScript'],
    link: 'https://github.com/learnerCodeZ/exam-prep-ultra',
    demo: 'https://exam-prep-ultra.pages.dev/',
    status: 'active',
    date: '2026-07-08',
    published: '2026-08-07',
  },
];
