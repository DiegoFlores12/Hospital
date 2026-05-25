import { examRepository } from '../repositories/examRepository.js';

export const examController = {
  async myExams(req, res, next) {
    try {
      res.json(await examRepository.listByPatient(req.user.id));
    } catch (error) {
      next(error);
    }
  }
};
