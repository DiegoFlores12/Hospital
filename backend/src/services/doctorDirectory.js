import { staffRepository } from '../repositories/staffRepository.js';

class SearchAllDoctors {
  search() {
    return staffRepository.listDoctors();
  }
}

class SearchDoctorsBySpecialty {
  constructor(especialidad) {
    this.especialidad = especialidad;
  }

  search() {
    return staffRepository.listDoctorsBySpecialty(this.especialidad);
  }
}

export class DoctorDirectory {
  static createSearch(especialidad) {
  return especialidad ? new SearchDoctorsBySpecialty(especialidad) : new SearchAllDoctors();
  }
}
