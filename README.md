# الفاحص الذكي

نظام ويب عربي لإدارة فحص مراكز التحكم والمراقبة الأمنية في المنشآت، مبني باستخدام Next.js وTypeScript وTailwind CSS وPrisma وPostgreSQL عبر Neon.

## التشغيل المحلي

1. انسخ ملف البيئة:

```bash
cp .env.example .env
```

2. ضع رابط Neon في `DATABASE_URL` ثم ثبّت الحزم وجهّز قاعدة البيانات:

```bash
npm install
npm run setup
```

3. شغّل التطبيق:

```bash
npm run dev
```

بيانات دخول المدير الافتراضية: `123456`

## الصفحات الأساسية

- `/` دخول المدير
- `/admin` لوحة المدير
- `/admin/inspectors` إدارة الفاحصين
- `/admin/weeks` إدارة أسابيع الفحص والروابط
- `/admin/reports` التقارير
- `/admin/audit` سجل التدقيق
- `/admin/criteria` إدارة المعايير
- `/admin/facility-types` تصنيف المنشآت
- `/admin/settings` الإعدادات
- `/w/[token]` رابط الفاحص الأسبوعي

## ملاحظات النشر

يستخدم النظام PostgreSQL، ويوصى باستخدام Neon في الإنتاج مع إضافة `DATABASE_URL` في Vercel Environment Variables.
