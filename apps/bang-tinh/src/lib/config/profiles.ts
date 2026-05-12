export type ProfileType = 'administrative' | 'business' | 'teacher' | 'student' | 'novel' | 'poem' | 'music';

export interface ProfileConfig {
  id: ProfileType;
  name: string;
  icon: string;
  paperClass: string;
  wrapperClass: string;
  hasLeftSidebar: boolean;
  hasRightTemplates: boolean;
  toolbarFeatures: {
    showTextFormat: boolean;
    showAlignment: boolean;
    showLists: boolean;
    showIndents: boolean;
    showBasicMath: boolean;
    showComplexMath: boolean;
  };
}

export const PROFILES: ProfileConfig[] = [
  {
    id: 'administrative',
    name: 'Nhà nước (Nghị định 30)',
    icon: '🏛️',
    paperClass: 'administrative-profile w-[794px] min-h-[1123px] border border-gray-300 p-[94px_75px_75px_113px] font-[Times_New_Roman] text-[14pt] leading-[1.5]',
    wrapperClass: 'bg-office-bg',
    hasLeftSidebar: true,
    hasRightTemplates: true,
    toolbarFeatures: { showTextFormat: true, showAlignment: true, showLists: true, showIndents: true, showBasicMath: false, showComplexMath: false }
  },
  {
    id: 'business',
    name: 'Doanh nghiệp (Nghiệp vụ)',
    icon: '💼',
    paperClass: 'business-profile w-[794px] min-h-[1123px] border border-gray-300 p-[94px_75px_75px_75px] font-[Times_New_Roman] text-[13pt] leading-[1.5]',
    wrapperClass: 'bg-office-bg',
    hasLeftSidebar: true,
    hasRightTemplates: true,
    toolbarFeatures: { showTextFormat: true, showAlignment: true, showLists: true, showIndents: true, showBasicMath: false, showComplexMath: false }
  },
  {
    id: 'teacher',
    name: 'Giáo viên (Giáo án, Ra đề)',
    icon: '👩‍🏫',
    paperClass: 'teacher-profile w-[794px] min-h-[1123px] border border-gray-300 p-[75px] font-sans text-[12pt] leading-[1.6]',
    wrapperClass: 'bg-office-bg',
    hasLeftSidebar: true,
    hasRightTemplates: true,
    toolbarFeatures: { showTextFormat: true, showAlignment: true, showLists: true, showIndents: true, showBasicMath: true, showComplexMath: true }
  },
  {
    id: 'student',
    name: 'Học sinh (Tiểu luận, Báo cáo)',
    icon: '🎒',
    paperClass: 'student-profile w-[794px] min-h-[1123px] border border-gray-300 p-[75px] font-sans text-[12pt] leading-[1.6] bg-white',
    wrapperClass: 'bg-office-bg',
    hasLeftSidebar: true,
    hasRightTemplates: true,
    toolbarFeatures: { showTextFormat: true, showAlignment: true, showLists: true, showIndents: true, showBasicMath: true, showComplexMath: true }
  },
  {
    id: 'novel',
    name: 'Tiểu thuyết (Zen Mode)',
    icon: '📖',
    paperClass: 'novel-profile w-[700px] min-h-screen p-16 font-serif text-[18px] leading-[1.8] text-[#333] shadow-none bg-[#F9F6EE]',
    wrapperClass: 'bg-[#F9F6EE]',
    hasLeftSidebar: true,
    hasRightTemplates: true,
    toolbarFeatures: { showTextFormat: true, showAlignment: true, showLists: false, showIndents: true, showBasicMath: false, showComplexMath: false }
  },
  {
    id: 'poem',
    name: 'Làm thơ (Căn giữa)',
    icon: '🎭',
    paperClass: 'poem-profile w-[600px] min-h-screen p-16 font-serif text-[16px] leading-[2.0] text-[#444] shadow-none bg-[#FDFBF7]',
    wrapperClass: 'bg-office-bg',
    hasLeftSidebar: true,
    hasRightTemplates: true,
    toolbarFeatures: { showTextFormat: true, showAlignment: true, showLists: false, showIndents: false, showBasicMath: false, showComplexMath: false }
  },
  {
    id: 'music',
    name: 'Soạn nhạc (Chords)',
    icon: '🎵',
    paperClass: 'music-profile w-[800px] min-h-screen p-12 font-mono text-[14px] leading-relaxed bg-gray-50 border border-gray-200',
    wrapperClass: 'bg-office-bg',
    hasLeftSidebar: true,
    hasRightTemplates: false,
    toolbarFeatures: { showTextFormat: true, showAlignment: true, showLists: true, showIndents: true, showBasicMath: false, showComplexMath: false }
  }
];

export function getProfileConfig(id: ProfileType): ProfileConfig {
  return PROFILES.find(p => p.id === id) || PROFILES[0];
}
