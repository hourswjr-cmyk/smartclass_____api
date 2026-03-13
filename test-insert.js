const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://dwcmoptzaklatlbewnwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3Y21vcHR6YWtsYXRsYmV3bnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODc1ODAsImV4cCI6MjA4NzI2MzU4MH0.I_czuRY7pCvHgER-XXpyeFL2Yjnw6VkM1RTLxyBWvF4'
);

async function run() {
  const { error } = await supabase.from('teachers').insert([
    {
      user_id: 9999999, // deliberate fake user id, might trigger FK error if it gets that far
      employee_code: 'TEST-123',
      full_name: 'Test',
      qualification: 'Test',
      department: 'Test',
      joining_date: '2026-01-01',
      is_class_teacher: false
    }
  ]);
  console.log(JSON.stringify(error, null, 2));
}
run();
