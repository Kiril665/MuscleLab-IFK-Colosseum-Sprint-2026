import { NormalizedSkeleton, VerificationFrameResult } from './poseTypes';

export function drawBiomechanicalSkeleton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  skeleton: NormalizedSkeleton,
  result: VerificationFrameResult | null,
  mirrored: boolean = false
): void {
  const isGoodAlignment = result?.isAlignmentValid ?? true;
  const isFullBody = result?.isFullBodyVisible ?? skeleton.isFullBodyVisible ?? true;
  const boneColor = !isFullBody ? '#eab308' : (isGoodAlignment ? '#10b981' : '#f43f5e'); // Yellow warning vs Emerald vs Rose
  const jointColor = '#f59e0b'; // Amber

  const toPx = (pt: { x: number; y: number }) => ({
    x: (mirrored ? 1 - pt.x : pt.x) * width,
    y: pt.y * height
  });

  const isVisible = (pt: { visibility?: number }) => (pt.visibility ?? 0.8) >= 0.5;

  const drawSegment = (p1: { x: number; y: number; visibility?: number }, p2: { x: number; y: number; visibility?: number }, widthPx: number = 3) => {
    // If full body is NOT visible, do not draw segments to missing/low-confidence joints
    if (!isFullBody && (!isVisible(p1) || !isVisible(p2))) {
      return;
    }
    const a = toPx(p1);
    const b = toPx(p2);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = boneColor;
    ctx.lineWidth = widthPx;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const drawJoint = (p: { x: number; y: number; visibility?: number }, r: number = 4) => {
    if (!isFullBody && !isVisible(p)) {
      return;
    }
    const pt = toPx(p);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fillStyle = jointColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // Draw Head
  if (isVisible(skeleton.nose)) {
    const nosePx = toPx(skeleton.nose);
    ctx.beginPath();
    ctx.arc(nosePx.x, nosePx.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw Shoulders line
  drawSegment(skeleton.leftShoulder, skeleton.rightShoulder, 4);

  // Draw Left Arm
  drawSegment(skeleton.leftShoulder, skeleton.leftElbow, 3);
  drawSegment(skeleton.leftElbow, skeleton.leftWrist, 3);

  // Draw Right Arm
  drawSegment(skeleton.rightShoulder, skeleton.rightElbow, 3);
  drawSegment(skeleton.rightElbow, skeleton.rightWrist, 3);

  // Draw Torso
  drawSegment(skeleton.leftShoulder, skeleton.leftHip, 3);
  drawSegment(skeleton.rightShoulder, skeleton.rightHip, 3);
  drawSegment(skeleton.leftHip, skeleton.rightHip, 3);

  // Draw Legs (strictly checked for visibility)
  drawSegment(skeleton.leftHip, skeleton.leftKnee, 3);
  drawSegment(skeleton.leftKnee, skeleton.leftAnkle, 3);
  drawSegment(skeleton.rightHip, skeleton.rightKnee, 3);
  drawSegment(skeleton.rightKnee, skeleton.rightAnkle, 3);

  // Draw Joint nodes
  drawJoint(skeleton.leftShoulder);
  drawJoint(skeleton.rightShoulder);
  drawJoint(skeleton.leftElbow, 5);
  drawJoint(skeleton.rightElbow, 5);
  drawJoint(skeleton.leftWrist);
  drawJoint(skeleton.rightWrist);
  drawJoint(skeleton.leftHip);
  drawJoint(skeleton.rightHip);
  drawJoint(skeleton.leftKnee, 5);
  drawJoint(skeleton.rightKnee, 5);
  drawJoint(skeleton.leftAnkle);
  drawJoint(skeleton.rightAnkle);

  // Draw Joint Angle Readout Pills
  if (result) {
    // Left Elbow Angle Pill
    if (result.leftElbowAngle !== null && isVisible(skeleton.leftElbow)) {
      const elb = toPx(skeleton.leftElbow);
      drawAnglePill(ctx, elb.x - 36, elb.y - 12, `${result.leftElbowAngle}°`, isGoodAlignment);
    }
    // Right Elbow Angle Pill
    if (result.rightElbowAngle !== null && isVisible(skeleton.rightElbow)) {
      const elb = toPx(skeleton.rightElbow);
      drawAnglePill(ctx, elb.x + 8, elb.y - 12, `${result.rightElbowAngle}°`, isGoodAlignment);
    }

    // Top-left HUD status banner
    ctx.fillStyle = 'rgba(10, 10, 12, 0.88)';
    ctx.fillRect(8, 8, 204, 52);
    ctx.strokeStyle = !isFullBody ? '#eab308' : (isGoodAlignment ? '#10b981' : '#f43f5e');
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 204, 52);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`BIOMECHANICS: ${result.exerciseId.toUpperCase()}`, 14, 22);

    ctx.fillStyle = !isFullBody ? '#facc15' : (isGoodAlignment ? '#10b981' : '#f43f5e');
    ctx.font = 'bold 9px monospace';
    ctx.fillText(!isFullBody ? '⚠️ ПОЗИЦІОНУВАННЯ КАМЕРИ' : result.alignmentStatus, 14, 35);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText(`CONF: ${result.confidence}% | STATE: ${result.state}`, 14, 48);

    // Top-right Phase Badge
    const phaseColors: Record<string, string> = {
      IDLE: '#64748b',
      POSITIONING: '#eab308',
      READY: '#3b82f6',
      DESCENDING: '#f59e0b',
      BOTTOM: '#ea580c',
      ASCENDING: '#06b6d4',
      TOP: '#10b981'
    };
    const phaseColor = phaseColors[result.state] || '#f59e0b';
    ctx.fillStyle = 'rgba(10, 10, 12, 0.85)';
    ctx.fillRect(width - 100, 8, 92, 22);
    ctx.strokeStyle = phaseColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(width - 100, 8, 92, 22);

    ctx.fillStyle = phaseColor;
    ctx.font = 'bold 9px monospace';
    ctx.fillText(result.state, width - 94, 22);

    // Right-edge ROM progress bar
    const barW = 6;
    const barH = height - 40;
    const barX = width - 12;
    const barY = 20;

    ctx.fillStyle = 'rgba(24, 24, 27, 0.8)';
    ctx.fillRect(barX, barY, barW, barH);

    const fillH = (barH * (result.repProgress || 0)) / 100;
    ctx.fillStyle = result.repProgress > 80 ? '#10b981' : '#f59e0b';
    ctx.fillRect(barX, barY + barH - fillH, barW, fillH);
  }

  // Visual Overlay Banner when Full Body is NOT visible (Prompt Requirement 2)
  if (!isFullBody) {
    const bannerW = Math.min(width - 24, 288);
    const bannerH = 56;
    const bannerX = (width - bannerW) / 2;
    const bannerY = height - bannerH - 12;

    ctx.fillStyle = 'rgba(15, 15, 18, 0.92)';
    ctx.beginPath();
    ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ Не видно все тіло', width / 2, bannerY + 18);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '9px sans-serif';
    ctx.fillText('Відійдіть від камери / покладіть телефон так,', width / 2, bannerY + 34);
    ctx.fillText('щоб було видно від голови до ніг', width / 2, bannerY + 47);
    ctx.textAlign = 'start';
  }
}

function drawAnglePill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  isValid: boolean
): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(x, y, 32, 16);
  ctx.strokeStyle = isValid ? '#10b981' : '#f59e0b';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, 32, 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(text, x + 4, y + 11);
}
