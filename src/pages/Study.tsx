import { GradesRecord } from "../components/GradesRecord";
import { SessionTimer } from "../components/SessionTimer";
import { Agenda } from "../components/Agenda";

export function Study() {
  return (
    <div className="space-y-4">
      {/* 1 · calendario + temporizador de sesión */}
      <Agenda side={<SessionTimer />} />

      {/* 2 · notas de los exámenes */}
      <GradesRecord />
    </div>
  );
}
