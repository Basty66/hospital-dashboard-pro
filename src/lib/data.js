export async function fetchHospitalData() {
  const response = await fetch("/data/rem.json");
  if (!response.ok) throw new Error("No se pudo cargar rem.json");
  return response.json();
}

export function monthLabel(value) {
  const month = value.split("-")[1];
  const map = {
    "01": "Ene",
    "02": "Feb",
    "03": "Mar",
    "04": "Abr",
    "05": "May",
    "06": "Jun",
    "07": "Jul",
    "08": "Ago",
    "09": "Sep",
    "10": "Oct",
    "11": "Nov",
    "12": "Dic",
  };
  return map[month] || value;
}

export function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}
