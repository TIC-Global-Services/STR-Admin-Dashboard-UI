import localFont from "next/font/local";


export const Halfre = localFont({
  src: [{ path: "./halfre/halfre.otf", weight: "400", style: "normal" }],
  variable: "--font-halfre",
  display: "swap",
});

export const Velcan = localFont({
  src: [{ path: "./velcan/Velcan-Regular.otf", weight: "400", style: "normal" }],
  variable: "--font-velcan",
  display: "swap",
});
