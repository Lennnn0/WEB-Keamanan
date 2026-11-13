-- ==============================================================================
-- ExamCenter Database RLS Policies - Migration 02
-- Row Level Security & Access Control
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- If role is admin, initialize MFA settings
  IF (COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'admin') THEN
    INSERT INTO public.admin_mfa_settings (user_id, is_mfa_enabled)
    VALUES (NEW.id, false)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- Admin MFA Settings Policies
CREATE POLICY "Admin can view own MFA settings"
  ON public.admin_mfa_settings FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin can update own MFA settings"
  ON public.admin_mfa_settings FOR UPDATE
  USING (auth.uid() = user_id AND public.is_admin());

-- OTP Challenges Policies: Service Role Only! (Direct user access denied)
-- Note: Supabase Service Role key bypasses RLS automatically.
CREATE POLICY "OTP challenges blocked for public access"
  ON public.otp_challenges FOR ALL
  USING (false);

-- Subjects Policies
CREATE POLICY "Anyone authenticated can view subjects"
  ON public.subjects FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage subjects"
  ON public.subjects FOR ALL
  USING (public.is_admin());

-- Questions Policies: Only Admins can directly query the full questions table
CREATE POLICY "Admins can view and manage questions"
  ON public.questions FOR ALL
  USING (public.is_admin());

-- Exams Policies
CREATE POLICY "Admins can manage all exams"
  ON public.exams FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can view published exams"
  ON public.exams FOR SELECT
  USING (is_published = true AND auth.role() = 'authenticated');

-- Exam Questions Policies
CREATE POLICY "Admins can manage exam questions"
  ON public.exam_questions FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can view questions for published exams"
  ON public.exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_questions.exam_id AND e.is_published = true
    )
  );

-- Exam Schedules Policies
CREATE POLICY "Authenticated users can view schedules"
  ON public.exam_schedules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage schedules"
  ON public.exam_schedules FOR ALL
  USING (public.is_admin());

-- Exam Attempts Policies
CREATE POLICY "Students can view their own attempts"
  ON public.exam_attempts FOR SELECT
  USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students can insert their own attempts"
  ON public.exam_attempts FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins or students can update attempts"
  ON public.exam_attempts FOR UPDATE
  USING (student_id = auth.uid() OR public.is_admin());

-- Exam Answers Policies
CREATE POLICY "Students can view their own answers"
  ON public.exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts ea
      WHERE ea.id = exam_answers.attempt_id AND (ea.student_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Students can insert or update own answers while in progress"
  ON public.exam_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts ea
      WHERE ea.id = exam_answers.attempt_id 
        AND ea.student_id = auth.uid()
        AND ea.status = 'in_progress'
    ) OR public.is_admin()
  );

-- Study Materials Policies
CREATE POLICY "Authenticated users can view study materials"
  ON public.study_materials FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage study materials"
  ON public.study_materials FOR ALL
  USING (public.is_admin());

-- Activity Logs Policies
CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

