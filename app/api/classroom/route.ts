import { assertClassroomAdmin, classroomCredentialStatus, googleClassroom } from '../../../lib/google-classroom';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function gate(request: Request) {
  const status = classroomCredentialStatus();
  if (!status.configured) return Response.json({ ok:false, error:'Google Classroom credentials are not configured' }, { status:503 });
  try { assertClassroomAdmin(request); }
  catch { return Response.json({ ok:false, error:'Unauthorized' }, { status:401 }); }
  return null;
}

export async function GET(request: Request) {
  const denied = gate(request); if (denied) return denied;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'courses.list';
  const courseId = url.searchParams.get('courseId') || '';
  try {
    if (action === 'courses.list') return Response.json({ ok:true, data: await googleClassroom.listCourses(Number(url.searchParams.get('pageSize') || 50)) });
    if (action === 'teachers.list' && courseId) return Response.json({ ok:true, data: await googleClassroom.listTeachers(courseId) });
    if (action === 'students.list' && courseId) return Response.json({ ok:true, data: await googleClassroom.listStudents(courseId) });
    if (action === 'courseWork.list' && courseId) return Response.json({ ok:true, data: await googleClassroom.listCourseWork(courseId) });
    return Response.json({ ok:false, error:'Unsupported action or missing courseId' }, { status:400 });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error ? error.message : 'Google Classroom request failed' }, { status:502 });
  }
}

export async function POST(request: Request) {
  const denied = gate(request); if (denied) return denied;
  const body = await request.json().catch(() => ({})) as Record<string, any>;
  const action = String(body.action || '');
  try {
    if (action === 'courses.create') {
      if (!body.course?.name || !body.course?.ownerId) return Response.json({ ok:false, error:'course.name and course.ownerId are required' }, { status:400 });
      return Response.json({ ok:true, data: await googleClassroom.createCourse(body.course) }, { status:201 });
    }
    if (action === 'teachers.create') {
      if (!body.courseId || !body.userId) return Response.json({ ok:false, error:'courseId and userId are required' }, { status:400 });
      return Response.json({ ok:true, data: await googleClassroom.addTeacher(String(body.courseId), String(body.userId)) }, { status:201 });
    }
    if (action === 'students.create') {
      if (!body.courseId || !body.userId) return Response.json({ ok:false, error:'courseId and userId are required' }, { status:400 });
      return Response.json({ ok:true, data: await googleClassroom.addStudent(String(body.courseId), String(body.userId), body.enrollmentCode ? String(body.enrollmentCode) : undefined) }, { status:201 });
    }
    if (action === 'courseWork.create') {
      if (!body.courseId || !body.courseWork?.title) return Response.json({ ok:false, error:'courseId and courseWork.title are required' }, { status:400 });
      return Response.json({ ok:true, data: await googleClassroom.createCourseWork(String(body.courseId), body.courseWork) }, { status:201 });
    }
    return Response.json({ ok:false, error:'Unsupported action' }, { status:400 });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error ? error.message : 'Google Classroom request failed' }, { status:502 });
  }
}
