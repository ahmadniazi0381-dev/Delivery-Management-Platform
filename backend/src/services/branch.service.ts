import prisma from '../config/db';

let defaultBranchId: string | null = null;

export async function getDefaultBranchId(): Promise<string> {
  if (defaultBranchId) {
    const exists = await prisma.branch.findUnique({ where: { id: defaultBranchId } });
    if (exists?.isActive) return defaultBranchId;
  }

  const branch = await prisma.branch.findFirst({
    where: { isDefault: true, isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  if (branch) {
    defaultBranchId = branch.id;
    return branch.id;
  }

  const created = await prisma.branch.create({
    data: {
      name: 'UCP Branch',
      code: 'UCP',
      isDefault: true,
      isActive: true,
      address: 'UCP Road, Block C, Johar Town, Lahore',
      phone: '+923001234567',
      latitude: 31.4475531,
      longitude: 74.2690347,
    },
  });
  defaultBranchId = created.id;
  return created.id;
}

export async function seedDefaultBranch(): Promise<void> {
  await getDefaultBranchId();
}
