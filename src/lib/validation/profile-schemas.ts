import { z } from 'zod';

export const studentProfileSchema = z.object({
  lastName: z.string().min(1, '姓は必須です'),
  firstName: z.string().min(1, '名は必須です'),
  lastNameKana: z.string().optional(),
  firstNameKana: z.string().optional(),
  nameAlphabet: z.string().optional(),
  entryType: z.string().optional(),
  birthdate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  giftedEpisodes: z.string().optional(),
  interests: z.array(z.string()).optional(),
  schoolName: z.string().optional(),
  cautions: z.string().optional(),
  howDidYouKnow: z.string().optional(),
});

export const parentProfileSchema = z.object({
  lastName: z.string().min(1, '姓は必須です'),
  firstName: z.string().min(1, '名は必須です'),
  lastNameKana: z.string().optional(),
  firstNameKana: z.string().optional(),
  nameAlphabet: z.string().optional(),
  phoneNumber: z.string().optional(),
  postalCode: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  addressDetail: z.string().optional(),
});

export const tutorProfileSchema = z.object({
  lastName: z.string().min(1, '姓は必須です'),
  firstName: z.string().min(1, '名は必須です'),
  lastNameKana: z.string().optional(),
  firstNameKana: z.string().optional(),
  nameAlphabet: z.string().optional(),
  phoneNumber: z.string().optional(),
  postalCode: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  addressDetail: z.string().optional(),
  nearestStation: z.string().optional(),
  affiliation: z.string().optional(),
  education: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  selfIntroduction: z.string().optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  branchName: z.string().optional(),
  branchCode: z.string().optional(),
  accountType: z.string().optional(),
  accountNumber: z.string().optional(),
  interviewCalendarUrl: z.string().optional(),
  lessonCalendarUrl: z.string().optional(),
});

export type StudentProfileFormData = z.infer<typeof studentProfileSchema>;
export type ParentProfileFormData = z.infer<typeof parentProfileSchema>;
export type TutorProfileFormData = z.infer<typeof tutorProfileSchema>;