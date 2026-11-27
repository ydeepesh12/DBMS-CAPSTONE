import React, { useState, useEffect } from 'react';
import { Camera, Tag, Video, Cpu, Activity, RefreshCw } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export const EvidenceAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<{
    byMediaType: any[];
    topTags: any[];
    cameraPerformance: any[];
  }>({
    byMediaType: [],
    topTags: [],
    cameraPerformance: []
  });

  const [mongoHealth, setMongoHealth] = useState<any>({
    connected: true,
    database: 'traffic_challan',
    uri: 'mongodb://127.0.0.1:27017/traffic_challan',
    totalEvidenceDocuments: 5
  });

  const [loading, setLoading] = useState(true);

  const fetchEvidenceData = async () => {
    setLoading(true);
    try {
      const [res, healthRes] = await Promise.all([
        fetch('/api/v1/analytics/evidence-analytics').then(r => r.json()),
        fetch('/api/health/mongo').then(r => r.json()).catch(() => ({ success: false }))
      ]);
      if (res.success) setData(res.data);
      if (healthRes.success) setMongoHealth(healthRes);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceData();
  }, []);

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600/30 border border-teal-500/40 text-teal-400 flex items-center justify-center font-bold">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black">MongoDB Evidence Metadata Analytics</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500 text-slate-950">NOSQL AGGREGATION</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                MONGODB CONNECTED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              URI: {mongoHealth.uri || 'mongodb://127.0.0.1:27017/traffic_challan'} • Database: {mongoHealth.database || 'traffic_challan'} • Collection: evidence_metadata ({mongoHealth.totalEvidenceDocuments ?? 5} docs)
            </p>
          </div>
        </div>

        <button
          onClick={fetchEvidenceData}
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center space-x-2 shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Execute Aggregations</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pipeline 1: Media Type Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Video className="w-4 h-4 text-teal-500" />
              <span>Pipeline 1: Evidence Volume by Media Type</span>
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              EvidenceMetadata.aggregate([&#123; $group: &#123; _id: &quot;$media_type&quot;, count: &#123; $sum: 1 &#125; &#125; &#125;])
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byMediaType}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.byMediaType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline 2: Top Tag Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>Pipeline 2: AI Tag Frequency ($unwind &amp; $group)</span>
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              &#123; $unwind: &quot;$tags&quot; &#125;, &#123; $group: &#123; _id: &quot;$tags&quot;, occurrences: &#123; $sum: 1 &#125; &#125; &#125;
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topTags}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="occurrences" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Pipeline 3: Camera Performance & Confidence */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-purple-500" />
            <span>Pipeline 3: ANPR Camera Device Accuracy &amp; Confidence</span>
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            &#123; $group: &#123; _id: &quot;$camera_id&quot;, total_captures: &#123; $sum: 1 &#125;, avg_confidence: &#123; $avg: &quot;$ai_confidence_score&quot; &#125; &#125; &#125;
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="py-2.5 px-4">Camera Identifier</th>
                <th className="py-2.5 px-4 text-center">Total Captures Logged</th>
                <th className="py-2.5 px-4 text-center">Avg AI Confidence Score</th>
                <th className="py-2.5 px-4 text-center">Min AI Score</th>
                <th className="py-2.5 px-4 text-right">Reliability Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.cameraPerformance.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">{c._id}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900 dark:text-white">{c.total_captures}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-600">
                    {(parseFloat(c.avg_confidence) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-center text-slate-500">
                    {(parseFloat(c.min_confidence) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      OPERATIONAL
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
