// Configuração pública de runtime. A anon key do Supabase é pública por design;
// autorização deve continuar sendo garantida por RLS e funções do banco.
window.PEIA_CONFIG = Object.freeze({
  appVersion: '1.13.0',
  datasetVersion: 'tse-ms-2010-2024-v1',
  datasetFunctionUrl: 'https://rclbjiqfabuuhiwxmjwp.supabase.co/functions/v1/dataset',
  testerFunctionUrl: 'https://rclbjiqfabuuhiwxmjwp.supabase.co/functions/v1/tester-access',
  adminFunctionUrl: 'https://rclbjiqfabuuhiwxmjwp.supabase.co/functions/v1/admin-access',
  directInviteFunctionUrl: 'https://rclbjiqfabuuhiwxmjwp.supabase.co/functions/v1/direct-invite-access',
  supabaseUrl: 'https://rclbjiqfabuuhiwxmjwp.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbGJqaXFmYWJ1dWhpd3htandwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTM4MTYsImV4cCI6MjA5OTA4OTgxNn0.2_bJssx4sJaRyUx0VzTq85myHjcwyLnzluf_Ap2bydU'
});
