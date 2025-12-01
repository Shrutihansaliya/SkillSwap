// src/pages/Admin/Charts.jsx
import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/*
  Improved, attractive chart components for Admin dashboard.
  - Pastel gradients, center-total label for donuts
  - Compact sizes, smooth animations, and custom tooltip/legend
  - Designed to look good in small/narrow dashboard widgets
*/

/* ---- Palette & gradient ids ---- */
const PALETTE = ["#7c3aed", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];
const GRAD_IDS = ["g0", "g1", "g2", "g3", "g4"];

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeNameValue(input = []) {
  if (!Array.isArray(input)) return [];
  return input.map((d, i) => {
    if (!d || typeof d !== "object") return { name: String(d ?? `Item ${i}`), value: 0 };
    const name = d.name ?? d.month ?? d.label ?? `Item ${i}`;
    const value = safeNumber(d.value ?? d.count ?? 0);
    return { name, value };
  });
}

/* ---- Small helper components ---- */
const BoxedTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-md shadow-lg bg-white border border-gray-100 p-2 text-xs">
      {label !== undefined && <div className="font-medium text-gray-700 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          <div className="text-gray-600">{p.name}: </div>
          <div className="font-semibold text-gray-800 ml-1">{p.value}</div>
        </div>
      ))}
    </div>
  );
};

const renderLegend = (props) => {
  const { payload } = props;
  if (!payload || !payload.length) return null;
  return (
    <div className="flex items-center justify-center gap-3 text-xs mt-1">
      {payload.map((entry, i) => (
        <div key={`lg-${i}`} className="flex items-center gap-1">
          <span className="w-2 h-2 inline-block" style={{ background: entry.color }} />
          <span className="text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ---- Center label renderer for pie/donut showing total ---- */
const renderCenterText = (total) => {
  return (
    <foreignObject x="0" y="0" width="100%" height="100%">
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-lg font-bold text-gray-800">{total}</div>
        </div>
      </div>
    </foreignObject>
  );
};

/* ---- PAYMENT CHART (compact donut with center total) ---- */
export const PaymentChart = ({ data = [] }) => {
  const pieData = normalizeNameValue(data);
  if (!pieData.length) return <div className="text-xs text-gray-400">No payment data</div>;

  const total = pieData.reduce((s, d) => s + safeNumber(d.value), 0);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* gradients */}
          <defs>
            {PALETTE.map((c, i) => (
              <linearGradient id={GRAD_IDS[i]} key={i} x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity="0.95" />
                <stop offset="100%" stopColor={c} stopOpacity="0.7" />
              </linearGradient>
            ))}
          </defs>

          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={4}
            isAnimationActive={true}
            animationDuration={600}
            startAngle={90}
            endAngle={-270}
            stroke="transparent"
            labelLine={false}
            label={false}
          >
            {pieData.map((_, i) => (
              <Cell key={`p-${i}`} fill={`url(#${GRAD_IDS[i % GRAD_IDS.length]})`} />
            ))}
          </Pie>

          <Tooltip content={<BoxedTooltip />} />
          <Legend verticalAlign="bottom" align="center" content={renderLegend} />
          {/* center total using SVG foreignObject */}
          {renderCenterText(total)}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ---- ActiveSwapChart (donut with center total & filtered segments) ---- */
export const ActiveSwapChart = ({ stats = null, swaps = [] }) => {
  let counts = { Active: 0, Completed: 0, Pending: 0, Cancelled: 0 };

  if (stats && typeof stats === "object") {
    counts.Active = safeNumber(stats.activeSwaps ?? stats.active ?? 0);
    counts.Completed = safeNumber(stats.completedSwaps ?? stats.completed ?? 0);
    counts.Pending = safeNumber(stats.pendingRequests ?? stats.pending ?? 0);
    counts.Cancelled = safeNumber(stats.cancelledSwaps ?? stats.cancelled ?? 0);
  } else if (Array.isArray(swaps) && swaps.length) {
    swaps.forEach((s) => {
      const st = String(s.Status ?? s.status ?? "").trim().toLowerCase();
      if (st === "active") counts.Active += 1;
      else if (st === "completed") counts.Completed += 1;
      else if (st === "pending") counts.Pending += 1;
      else if (st === "cancelled" || st === "canceled") counts.Cancelled += 1;
      else counts.Pending += 1;
    });
  }

  const data = [
    { name: "Active", value: counts.Active },
    { name: "Completed", value: counts.Completed },
    { name: "Pending", value: counts.Pending },
    ...(counts.Cancelled > 0 ? [{ name: "Cancelled", value: counts.Cancelled }] : []),
  ].filter((d) => safeNumber(d.value) >= 0);

  const total = data.reduce((s, d) => s + safeNumber(d.value), 0);
  if (total === 0) return <div className="text-xs text-gray-400">No swap activity yet</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          {PALETTE.map((c, i) => (
            <linearGradient id={`as-${i}`} key={i} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="0.95" />
              <stop offset="100%" stopColor={c} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>

        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="50%"
          outerRadius="85%"
          paddingAngle={6}
          startAngle={90}
          endAngle={-270}
          isAnimationActive
          animationDuration={600}
          stroke="transparent"
          label={false}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={`a-${i}`} fill={`url(#as-${i % PALETTE.length})`} />
          ))}
        </Pie>

        <Tooltip content={<BoxedTooltip />} />
        <Legend verticalAlign="bottom" align="center" content={renderLegend} />
        {renderCenterText(total)}
      </PieChart>
    </ResponsiveContainer>
  );
};

/* ---- SkillSwapChart (stacked bars or single series) ---- */
export const SkillSwapChart = ({ data = [] }) => {
  if (!Array.isArray(data) || data.length === 0) return <div className="text-xs text-gray-400">No swap history</div>;

  const hasActiveCompleted = data.every((d) => d && (d.active !== undefined || d.completed !== undefined));

  if (hasActiveCompleted) {
    const barData = data.map((d) => ({
      name: d.month ?? d.name ?? d.label ?? "",
      active: safeNumber(d.active ?? 0),
      completed: safeNumber(d.completed ?? 0),
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={barData} margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip content={<BoxedTooltip />} />
          <Bar dataKey="active" stackId="a" radius={[6, 6, 6, 6]} fill={PALETTE[1]} />
          <Bar dataKey="completed" stackId="a" radius={[6, 6, 6, 6]} fill={PALETTE[0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  const singleSeries = normalizeNameValue(data);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={singleSeries} margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip content={<BoxedTooltip />} />
        <Bar dataKey="value" radius={[6, 6, 6, 6]} fill={PALETTE[0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

/* ---- SubscriptionsChart ---- */
export const SubscriptionsChart = ({ data = {} }) => {
  const breakdown = Array.isArray(data.breakdownPerPlan) ? data.breakdownPerPlan : [];
  const items =
    breakdown.length > 0
      ? breakdown.map((p) => ({ name: p.planName ?? p.name ?? "Plan", value: safeNumber(p.count ?? p.value ?? 0) }))
      : [{ name: "Subscriptions", value: safeNumber(data.totalSubscriptions ?? 0) }];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={items} margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<BoxedTooltip />} />
        <Bar dataKey="value" radius={[6, 6, 6, 6]} fill={PALETTE[2]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

/* ---- UsersChart (simple donut + center total) ---- */
export const UsersChart = ({ data = [] }) => {
  const series = Array.isArray(data) ? data : [{ name: "Members", value: safeNumber(data) }];
  if (!series.length) return <div className="text-xs text-gray-400">No user data</div>;

  const total = series.reduce((s, d) => s + safeNumber(d.value), 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          {PALETTE.map((c, i) => (
            <linearGradient id={`u-${i}`} key={i} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="0.95" />
              <stop offset="100%" stopColor={c} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>

        <Pie data={series} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" startAngle={90} endAngle={-270} stroke="transparent" label={false}>
          {series.map((_, i) => (
            <Cell key={`u-${i}`} fill={`url(#u-${i % PALETTE.length})`} />
          ))}
        </Pie>

        <Tooltip content={<BoxedTooltip />} />
        <Legend verticalAlign="bottom" align="center" content={renderLegend} />
        {renderCenterText(total)}
      </PieChart>
    </ResponsiveContainer>
  );
};

export default {
  PaymentChart,
  ActiveSwapChart,
  SkillSwapChart,
  SubscriptionsChart,
  UsersChart,
};
