import { ContentStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { CreateUnitInput, UpdateUnitInput } from './unit.validation.js';

export class UnitService {
  async createUnit(subjectId: string, input: CreateUnitInput) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject not found.');
    }

    const existingUnitNumber = await prisma.unit.findUnique({
      where: {
        subjectId_unitNumber: {
          subjectId,
          unitNumber: input.unitNumber,
        },
      },
    });

    if (existingUnitNumber) {
      throw new AppError(
        409,
        'DUPLICATE_UNIT_NUMBER',
        `Unit number ${input.unitNumber} already exists in this subject.`
      );
    }

    const unit = await prisma.unit.create({
      data: {
        subjectId,
        title: input.title.trim(),
        description: input.description?.trim(),
        unitNumber: input.unitNumber,
        displayOrder: input.displayOrder || input.unitNumber,
        status: input.status || ContentStatus.DRAFT,
      },
    });

    return unit;
  }

  async getUnitsBySubject(subjectId: string, userRole: Role) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject not found.');
    }

    if (userRole === Role.STUDENT && subject.status !== ContentStatus.PUBLISHED) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject is not published.');
    }

    const where = {
      subjectId,
      ...(userRole === Role.STUDENT ? { status: ContentStatus.PUBLISHED } : {}),
    };

    const units = await prisma.unit.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    });

    return units;
  }

  async getUnitById(id: string, userRole: Role) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        subject: true,
        topics: {
          where: userRole === Role.STUDENT ? { status: ContentStatus.PUBLISHED } : {},
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!unit) {
      throw new AppError(404, 'UNIT_NOT_FOUND', 'Unit not found.');
    }

    if (userRole === Role.STUDENT) {
      if (unit.status !== ContentStatus.PUBLISHED || unit.subject.status !== ContentStatus.PUBLISHED) {
        throw new AppError(404, 'UNIT_NOT_FOUND', 'Unit is not available.');
      }
    }

    return unit;
  }

  async updateUnit(id: string, input: UpdateUnitInput) {
    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) {
      throw new AppError(404, 'UNIT_NOT_FOUND', 'Unit not found.');
    }

    if (input.unitNumber && input.unitNumber !== unit.unitNumber) {
      const existing = await prisma.unit.findUnique({
        where: {
          subjectId_unitNumber: {
            subjectId: unit.subjectId,
            unitNumber: input.unitNumber,
          },
        },
      });
      if (existing) {
        throw new AppError(
          409,
          'DUPLICATE_UNIT_NUMBER',
          `Unit number ${input.unitNumber} already exists in this subject.`
        );
      }
    }

    const updated = await prisma.unit.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() } : {}),
        ...(input.unitNumber !== undefined ? { unitNumber: input.unitNumber } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    });

    return updated;
  }

  async deleteUnit(id: string) {
    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) {
      throw new AppError(404, 'UNIT_NOT_FOUND', 'Unit not found.');
    }

    await prisma.unit.delete({ where: { id } });
    return { deleted: true };
  }
}

export const unitService = new UnitService();
