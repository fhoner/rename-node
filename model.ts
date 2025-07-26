export interface RenameData {
  name?: string; // Stadtkirche St.Germanus
  country_code?: string; // de
  city?: string; // Stuttgart
  suburb?: string; // Untertürkheim
  street?: string; // Trettachstraße
  housenumber?: string; // 3
}

export interface GeoapifyReponse {
  results: RenameData[];
}
