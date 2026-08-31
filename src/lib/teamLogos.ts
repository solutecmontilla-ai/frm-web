import agapeLogo from "@/assets/teams/agape-fc.png";
import aviacionLogo from "@/assets/teams/aviacion-fc.png";
import chelseaLogo from "@/assets/teams/chelsea-fc.png";
import cimLogo from "@/assets/teams/cim.png";
import dvoAraguaLogo from "@/assets/teams/dvo-aragua-chv.png";
import frmLogo40 from "@/assets/teams/frm.png";
import golazoLogo from "@/assets/teams/golazo-fc.png";
import juventusLogo from "@/assets/teams/juventus-ng.png";
import losOlivosLogo from "@/assets/teams/los-olivos.png";
import pepitosLogo from "@/assets/teams/pepitos-el-point.png";
import realMaracayLogo from "@/assets/teams/real-maracay-fc.png";
import sanIgnacioLogo from "@/assets/teams/san-ignacio-fc.png";

import atleticoMarinoLogo from "@/assets/teams-35/atletico-marino.jpeg";
import atleticoSanIgnacioLogo from "@/assets/teams-35/atletico-san-ignacio.jpeg";
import coromotoFcLogo from "@/assets/teams-35/coromoto-fc.jpeg";
import fenixLogo from "@/assets/teams-35/fenix.jpeg";
import frmLogo35 from "@/assets/teams-35/frm.jpeg";
import theFamilyLogo from "@/assets/teams-35/the-family.jpeg";
import ingenierosLogo from "@/assets/teams-35/ingenieros.png";
import deportivoAraguaLogo from "@/assets/teams-35/deportivo-aragua.png";
import atlSanJoaquinLogo from "@/assets/teams-35/atl-san-joaquin.png";
import casaItalia35Logo from "@/assets/teams-35/casa-italia.png";
import juniorCanadaLogo from "@/assets/teams-35/junior-de-la-canada.png";

export const logos40: Record<string, string> = {
  "Ágape": agapeLogo,
  "Aviación": aviacionLogo,
  "Chelsea": chelseaLogo,
  "Casa Italia": cimLogo,
  "Deportivo Aragua-CHV": dvoAraguaLogo,
  "FRM": frmLogo40,
  "Golazo": golazoLogo,
  "Juventus": juventusLogo,
  "Los Olivos FC": losOlivosLogo,
  "Olivos": losOlivosLogo,
  "Pepitos Point": pepitosLogo,
  "Real Maracay": realMaracayLogo,
  "Consorcio": sanIgnacioLogo,
};

export const logos35: Record<string, string> = {
  "Atl. Mariño": atleticoMarinoLogo,
  "Atl. San Ignacio": atleticoSanIgnacioLogo,
  "Coromoto FC": coromotoFcLogo,
  "Fénix": fenixLogo,
  "FRM": frmLogo35,
  "The Family": theFamilyLogo,
  "Ingenieros": ingenierosLogo,
  "Deportivo Aragua FC": deportivoAraguaLogo,
  "Atl. San Joaquín": atlSanJoaquinLogo,
  "Casa Italia": casaItalia35Logo,
  "Junior la Cañada": juniorCanadaLogo,
};

export function getLogo40(name: string): string {
  return logos40[name] ?? "/placeholder.svg";
}

export function getLogo35(name: string): string {
  return logos35[name] ?? "/placeholder.svg";
}
