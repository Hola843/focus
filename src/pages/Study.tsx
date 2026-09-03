import { Agenda } from "../components/Agenda";
import { GradesRecord } from "../components/GradesRecord";
import { SessionTimer } from "../components/SessionTimer";
import { StudyTutor } from "../components/StudyTutor";

export function Study() {
  return (
    <div className="space-y-4">
      {/* 1 · calendario + temporizador de sesión */}
      <Agenda side={<SessionTimer />} />

      {/* 2 · tutor con IA */}
      <StudyTutor />

      {/* 3 · notas de los exámenes */}
      <GradesRecord />
    </div>
  );
}
