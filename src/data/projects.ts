export interface Project {
  name: string;
  slug: string;
  repo: string;
  description: string;
  tags: string[];
  link: string;
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
];
