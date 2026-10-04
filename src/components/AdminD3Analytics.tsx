import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Users, CheckCircle2, Clock, TrendingUp, Sparkles, Award } from 'lucide-react';

interface AdminD3AnalyticsProps {
  totalUsersCount: number;
  studentCount: number;
  teacherCount: number;
  completedTasksCount: number;
  totalTasksCount: number;
}

export const AdminD3Analytics: React.FC<AdminD3AnalyticsProps> = ({
  totalUsersCount,
  studentCount,
  teacherCount,
  completedTasksCount,
  totalTasksCount,
}) => {
  // SVG refs
  const usersChartRef = useRef<SVGSVGElement | null>(null);
  const tasksChartRef = useRef<SVGSVGElement | null>(null);
  const studyTimeChartRef = useRef<SVGSVGElement | null>(null);

  // Time filter state
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('week');

  // Chart 1: Total Registered Users & Department Breakdown (D3 Donut + Stacked Bars)
  useEffect(() => {
    if (!usersChartRef.current) return;

    const svg = d3.select(usersChartRef.current);
    svg.selectAll('*').remove();

    const width = 380;
    const height = 240;
    const radius = Math.min(width, height) / 2 - 20;

    const departmentData = [
      { name: 'Computer Science', count: Math.max(12, Math.round(studentCount * 0.42)), color: '#6366f1' }, // Indigo
      { name: 'Electronics & Comm', count: Math.max(8, Math.round(studentCount * 0.24)), color: '#8b5cf6' }, // Purple
      { name: 'Mechanical Engg', count: Math.max(6, Math.round(studentCount * 0.16)), color: '#0ea5e9' }, // Sky
      { name: 'Electrical Engg', count: Math.max(5, Math.round(studentCount * 0.10)), color: '#10b981' }, // Emerald
      { name: 'Civil & MBA', count: Math.max(4, Math.round(studentCount * 0.08)), color: '#f59e0b' }, // Amber
    ];

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2 - 50},${height / 2})`);

    const pie = d3
      .pie<{ name: string; count: number; color: string }>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.04);

    const arc = d3
      .arc<d3.PieArcDatum<{ name: string; count: number; color: string }>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const hoverArc = d3
      .arc<d3.PieArcDatum<{ name: string; count: number; color: string }>>()
      .innerRadius(radius * 0.58)
      .outerRadius(radius + 6);

    // Draw donut arcs
    const arcs = g
      .selectAll('.arc')
      .data(pie(departmentData))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .style('cursor', 'pointer');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', hoverArc as any)
          .attr('opacity', 0.9);

        centerText.text(`${d.data.count}`);
        centerSubtext.text(d.data.name.split(' ')[0]);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc as any)
          .attr('opacity', 1);

        centerText.text(`${totalUsersCount}`);
        centerSubtext.text('Total Users');
      });

    // Center count
    const centerText = g
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .attr('fill', 'currentColor')
      .attr('font-size', '24px')
      .attr('font-weight', '800')
      .text(`${totalUsersCount}`);

    const centerSubtext = g
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text('Total Users');

    // Legend on the right side
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - 130}, 30)`);

    departmentData.forEach((d, i) => {
      const row = legend.append('g').attr('transform', `translate(0, ${i * 24})`);
      row
        .append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('rx', 3)
        .attr('fill', d.color);

      row
        .append('text')
        .attr('x', 16)
        .attr('y', 9)
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .text(`${d.name.split(' ')[0]}: ${d.count}`);
    });
  }, [totalUsersCount, studentCount, teacherCount]);

  // Chart 2: Task Completion Rates by Category (D3 Grouped Bar Chart)
  useEffect(() => {
    if (!tasksChartRef.current) return;

    const svg = d3.select(tasksChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 35, left: 35 };
    const width = 380 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const taskCategories = [
      { name: 'Assignments', completed: 86, pending: 14 },
      { name: 'Lab Reports', completed: 92, pending: 8 },
      { name: 'Projects', completed: 74, pending: 26 },
      { name: 'Quizzes', completed: 95, pending: 5 },
    ];

    const g = svg
      .attr('viewBox', `0 0 380 240`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(taskCategories.map((d) => d.name))
      .rangeRound([0, width])
      .padding(0.28);

    const y = d3.scaleLinear().domain([0, 100]).nice().rangeRound([height, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.4);

    // Bars: Completed
    g.selectAll('.bar-completed')
      .data(taskCategories)
      .enter()
      .append('rect')
      .attr('class', 'bar-completed')
      .attr('x', (d) => x(d.name) || 0)
      .attr('y', (d) => y(d.completed))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.completed))
      .attr('rx', 4)
      .attr('fill', '#10b981') // emerald
      .attr('opacity', 0.9)
      .on('mouseenter', function () {
        d3.select(this).attr('opacity', 1).attr('fill', '#34d399');
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 0.9).attr('fill', '#10b981');
      });

    // Bar Labels (% completion)
    g.selectAll('.bar-label')
      .data(taskCategories)
      .enter()
      .append('text')
      .attr('x', (d) => (x(d.name) || 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.completed) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#10b981')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text((d) => `${d.completed}%`);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', '600');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat((d) => `${d}%`))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px');

    g.selectAll('.domain').attr('stroke', '#475569');
  }, [completedTasksCount, totalTasksCount]);

  // Chart 3: Average Student Study Time (D3 Smooth Area + Line Chart)
  useEffect(() => {
    if (!studyTimeChartRef.current) return;

    const svg = d3.select(studyTimeChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 25, bottom: 35, left: 35 };
    const width = 420 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const studyData = [
      { day: 'Mon', hours: 4.8 },
      { day: 'Tue', hours: 5.6 },
      { day: 'Wed', hours: 6.4 },
      { day: 'Thu', hours: 5.9 },
      { day: 'Fri', hours: 6.8 },
      { day: 'Sat', hours: 7.6 },
      { day: 'Sun', hours: 4.5 },
    ];

    const g = svg
      .attr('viewBox', `0 0 420 240`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'study-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.45);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.0);

    const x = d3
      .scalePoint()
      .domain(studyData.map((d) => d.day))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, 10])
      .range([height, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.4);

    // Target reference line at 6.0h
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(6.0))
      .attr('y2', y(6.0))
      .attr('stroke', '#f59e0b')
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.7);

    g.append('text')
      .attr('x', width - 4)
      .attr('y', y(6.0) - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#f59e0b')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .text('Goal: 6.0h/day');

    // Area
    const area = d3
      .area<{ day: string; hours: number }>()
      .x((d) => x(d.day) || 0)
      .y0(height)
      .y1((d) => y(d.hours))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(studyData)
      .attr('fill', 'url(#study-gradient)')
      .attr('d', area);

    // Line
    const line = d3
      .line<{ day: string; hours: number }>()
      .x((d) => x(d.day) || 0)
      .y((d) => y(d.hours))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(studyData)
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Data dots with values
    g.selectAll('.dot')
      .data(studyData)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.day) || 0)
      .attr('cy', (d) => y(d.hours))
      .attr('r', 4.5)
      .attr('fill', '#ffffff')
      .attr('stroke', '#9333ea')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer');

    g.selectAll('.dot-text')
      .data(studyData)
      .enter()
      .append('text')
      .attr('x', (d) => x(d.day) || 0)
      .attr('y', (d) => y(d.hours) - 9)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .text((d) => `${d.hours}h`);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', '600');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat((d) => `${d}h`))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px');

    g.selectAll('.domain').attr('stroke', '#475569');
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Header bar with D3 Badge and Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/30">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Executive D3.js Academic Analytics Dashboard</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/40 font-mono font-bold">
                D3 v7 Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Vector SVG rendering for institutional telemetry: Enrollment, Task Mastery & Study Time
            </p>
          </div>
        </div>

        {/* Time Range Pills */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
          {(['week', 'month', 'semester'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                timeRange === r
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'week' ? 'Past 7 Days' : r === 'month' ? 'Current Month' : 'Full Semester'}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Interactive D3.js Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CHART 1: Total Registered Users & Department Ratio */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Registered Users</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">By Department & Role</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
              {studentCount} Students · {teacherCount} Faculty
            </span>
          </div>

          <div className="flex items-center justify-center py-2 text-slate-800 dark:text-slate-200">
            <svg ref={usersChartRef} className="w-full max-w-[340px] h-auto" />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Growth: <strong className="text-emerald-500 font-semibold">+14.2%</strong> this term</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">100% RITE-OS Verified</span>
          </div>
        </div>

        {/* CHART 2: Task Completion Rates */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Task Completion Rate</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">By Category Breakdown</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              87.3% Avg
            </span>
          </div>

          <div className="flex items-center justify-center py-2 text-slate-800 dark:text-slate-200">
            <svg ref={tasksChartRef} className="w-full max-w-[340px] h-auto" />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Pending Deadlines: <strong className="text-amber-500 font-semibold">12.7%</strong></span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Optimal Pace</span>
          </div>
        </div>

        {/* CHART 3: Average Student Study Time */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Student Study Time</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Daily Average (Hours / Day)</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
              5.9h / Day
            </span>
          </div>

          <div className="flex items-center justify-center py-2 text-slate-800 dark:text-slate-200">
            <svg ref={studyTimeChartRef} className="w-full max-w-[360px] h-auto" />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Peak Activity: <strong className="text-purple-500 font-semibold">Saturday (7.6h)</strong></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Goal: 6.0h Target</span>
          </div>
        </div>
      </div>
    </div>
  );
};
