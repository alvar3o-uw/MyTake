export type NewEntry = {
  title: string;
  rating: number | null;
};

export type LibraryEntry = NewEntry & {
  id: string;
  cover?: "arrival" | "bear" | "spirited" | "severance";
  year?: string;
  type?: string;
  status?: string;
};
