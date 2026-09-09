export type Role='student'|'teacher'|'educator'|'instructor'|'proctor'|'faculty'|'counselor'|'registrar'|'staff'|'administrator'|'developer';
export type AccountStatus='active'|'locked'|'suspended'|'disabled';
export type AccessProfile={userId:string;role:Role;roles:Role[];status:AccountStatus;mfa:boolean;classIds:string[];programIds:string[];permissions:string[]};
const staffRoles:Role[]=['teacher','educator','instructor','proctor','faculty','counselor','registrar','staff','administrator','developer'];
export const isActive=(p:AccessProfile)=>p.status==='active';
export const isStudent=(p:AccessProfile)=>p.role==='student'||p.roles.includes('student');
export const isStaff=(p:AccessProfile)=>staffRoles.some(r=>p.role===r||p.roles.includes(r));
export const hasPermission=(p:AccessProfile,permission:string)=>p.permissions.includes('*')||p.permissions.includes(permission);
export const hasClassScope=(p:AccessProfile,classId:string)=>p.classIds.includes(classId);
export function studentGate(p:AccessProfile){return isActive(p)&&isStudent(p)}
export function staffGate(p:AccessProfile){return isActive(p)&&isStaff(p)&&p.mfa}
export type ExamContext={assigned:boolean;releaseOpen:boolean;prerequisitesComplete:boolean;attemptsRemaining:boolean;identityVerified:boolean;proctorRequired:boolean;proctorApproved:boolean};
export function examGate(p:AccessProfile,c:ExamContext){if(!studentGate(p)||!hasPermission(p,'exam.take'))return false;return c.assigned&&c.releaseOpen&&c.prerequisitesComplete&&c.attemptsRemaining&&c.identityVerified&&(!c.proctorRequired||c.proctorApproved)}