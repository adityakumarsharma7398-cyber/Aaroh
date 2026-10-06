// MOCK DATA: stands in for backend responses until real services exist.
// Only src/services/* may import from src/data/mock. All people are fictional.
import type { Student, Teacher } from '../../types/domain'

export const mockStudents: Student[] = [
  { id: 'stu-1', name: 'Asha Verma' },
  { id: 'stu-2', name: 'Rohan Iyer' },
  { id: 'stu-3', name: 'Kabir Menon' },
  { id: 'stu-4', name: 'Isha Rao' },
  { id: 'stu-5', name: 'Dev Malhotra' },
  { id: 'stu-6', name: 'Tara Sen' },
]

export const mockTeachers: Teacher[] = [{ id: 'tea-1', name: 'Meera Nair' }]
