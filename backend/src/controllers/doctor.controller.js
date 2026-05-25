import { DoctorDirectory } from '../services/doctorDirectory.js';

export const doctorController = {
  async list(req, res, next) {
    try {
      const search = DoctorDirectory.createSearch(req.query.especialidad);
      const doctors = await search.search();
      res.json(doctors);
    } catch (error) {
      next(error);
    }
  }
};
