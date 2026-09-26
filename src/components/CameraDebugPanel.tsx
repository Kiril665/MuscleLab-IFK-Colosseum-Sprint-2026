import React, { useState } from 'react';
import { VerificationFrameResult } from '../services/pose/poseTypes';
import { runAllVerificationTests, TestResult } from '../services/pose/testScenarios';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Play, ShieldAlert, Cpu } from 'lucide-react';

interface CameraDebugPanelProps {
  telemetry: VerificationFrameResult | null;
  exerciseName: string;
}

export const CameraDebugPanel: React.FC<CameraDebugPanelProps> = ({ telemetry, exerciseName }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = runAllVerificationTests();
      setTestResults(results);
      setIsRunningTests(false);
    }, 150);
  };

  const stateColors: Record<string, string> = {
    IDLE: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    POSITIONING: 'bg-yellow-950/80 text-yellow-400 border-yellow-700 animate-pulse',
    READY: 'bg-blue-950/80 text-blue-400 border-blue-800',
    DESCENDING: 'bg-amber-950/80 text-amber-400 border-amber-800',
    BOTTOM: 'bg-orange-950/80 text-orange-400 border-orange-700',
    ASCENDING: 'bg-cyan-950/80 text-cyan-400 border-cyan-800',
    TOP: 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
  };

  return (
    <div className="bg-neutral-900/95 border border-neutral-700/80 rounded-xl p-3 text-xs font-mono shadow-2xl backdrop-blur-md">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
            Biomechanics Debug Telemetry
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="run-anticheat-tests-btn"
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3 h-3" />
            {isRunningTests ? 'Тестування...' : 'Запустити 11 тестів'}
          </button>
          <button
            id="toggle-debug-panel-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Main Grid Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Exercise & State */}
            <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
              <div className="text-[10px] text-neutral-500 uppercase">Exercise</div>
              <div className="font-bold text-white truncate text-[11px] mt-0.5">{exerciseName}</div>
              <div className="text-[10px] text-neutral-500 uppercase mt-2">State</div>
              <div
                className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold mt-0.5 ${
                  telemetry ? stateColors[telemetry.state] || 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {telemetry ? telemetry.state : 'IDLE'}
              </div>
            </div>

            {/* Repetition Truth Counters */}
            <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
              <div className="text-[10px] text-neutral-500 uppercase">Valid Reps</div>
              <div className="text-emerald-400 font-bold text-base">
                {telemetry ? telemetry.validReps : 0}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase mt-1">Rejected Reps</div>
              <div className="text-red-400 font-bold text-xs">
                {telemetry ? telemetry.rejectedReps : 0}
                {telemetry?.lastRejectReason && (
                  <span className="text-[9px] text-neutral-400 block truncate font-normal">
                    {telemetry.lastRejectReason}
                  </span>
                )}
              </div>
            </div>

            {/* Elbow Angles */}
            <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
              <div className="text-[10px] text-neutral-500 uppercase">Elbow Angle</div>
              <div className="text-amber-300 font-bold mt-0.5">
                L: {telemetry?.leftElbowAngle !== null && telemetry?.leftElbowAngle !== undefined ? `${telemetry.leftElbowAngle}°` : '—'}
              </div>
              <div className="text-amber-300 font-bold">
                R: {telemetry?.rightElbowAngle !== null && telemetry?.rightElbowAngle !== undefined ? `${telemetry.rightElbowAngle}°` : '—'}
              </div>
              {telemetry?.primaryElbowAngle && (
                <div className="text-[10px] text-neutral-400 mt-1">
                  ROM: {telemetry.primaryElbowAngle}°
                </div>
              )}
            </div>

            {/* Body Alignment & Confidence */}
            <div className="bg-neutral-950/80 p-2 rounded border border-neutral-800">
              <div className="text-[10px] text-neutral-500 uppercase">Body Alignment</div>
              <div
                className={`font-bold mt-0.5 text-[11px] flex items-center gap-1 ${
                  telemetry?.isAlignmentValid ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {telemetry?.isAlignmentValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                )}
                {telemetry?.isAlignmentValid ? 'GOOD' : 'INVALID'}
              </div>
              <div className="text-[9px] text-neutral-400 mt-0.5 truncate">
                Кут корпусу: {telemetry?.torsoAngle !== undefined ? `${telemetry.torsoAngle}°` : '—'}
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase">Confidence</div>
                  <div className="text-blue-400 font-bold">
                    {telemetry ? `${telemetry.confidence}%` : '0%'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase">Full body in frame</div>
                  <div className={`font-bold ${telemetry?.isFullBodyVisible ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {telemetry?.isFullBodyVisible ? 'YES' : 'NO'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Checks (Requirement 23) */}
          <div className="bg-neutral-950/90 p-2 rounded border border-neutral-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
            <div className="flex items-center justify-between p-1.5 bg-neutral-900/80 rounded border border-neutral-800/80">
              <span className="text-neutral-400">Pose Valid:</span>
              <span className={`font-bold ${telemetry?.isPoseValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {telemetry?.isPoseValid ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-neutral-900/80 rounded border border-neutral-800/80">
              <span className="text-neutral-400">Push-up Pos:</span>
              <span className={`font-bold ${telemetry?.isPushUpPosition ? 'text-emerald-400' : 'text-rose-400'}`}>
                {telemetry?.isPushUpPosition ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-neutral-900/80 rounded border border-neutral-800/80">
              <span className="text-neutral-400">Left Arm:</span>
              <span className={`font-bold ${telemetry?.isLeftArmValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {telemetry?.isLeftArmValid ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-neutral-900/80 rounded border border-neutral-800/80">
              <span className="text-neutral-400">Right Arm:</span>
              <span className={`font-bold ${telemetry?.isRightArmValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {telemetry?.isRightArmValid ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 bg-neutral-900/80 rounded border border-neutral-800/80 col-span-2 sm:col-span-1">
              <span className="text-neutral-400">Body Chain:</span>
              <span className={`font-bold ${telemetry?.isBodyChainValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {telemetry?.isBodyChainValid ? 'YES' : 'NO'}
              </span>
            </div>
          </div>

          {/* Feedback strip */}
          {telemetry?.feedback && (
            <div className="px-2.5 py-1.5 bg-neutral-950 rounded border border-neutral-800 text-neutral-300 text-[11px] flex items-center gap-2">
              <span className="text-amber-400">Сигнал:</span>
              <span className="truncate">{telemetry.feedback}</span>
            </div>
          )}

          {/* Test Scenarios Results Drawer */}
          {testResults && (
            <div className="mt-3 pt-3 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-neutral-300">
                  Результати валідації (Обов'язкові тести 1–11):
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {testResults.filter((t) => t.passed).length} / {testResults.length} ПРОЙДЕНО
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {testResults.map((t) => (
                  <div
                    key={t.id}
                    className={`p-2 rounded border text-[10px] flex items-start gap-2 ${
                      t.passed
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-neutral-200'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                    }`}
                  >
                    {t.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {t.id}: {t.name}
                      </div>
                      <div className="text-neutral-400 text-[9px] mt-0.5">
                        Очікувалось: <span className="text-neutral-300">{t.expected}</span> | Зараховано:{' '}
                        <span className={t.validReps > 0 ? 'text-amber-400' : 'text-neutral-300'}>
                          {t.validReps}
                        </span>{' '}
                        | Відхилено: <span className="text-neutral-300">{t.rejectedReps}</span>
                      </div>
                      <div className="text-emerald-400 text-[9px]">{t.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
