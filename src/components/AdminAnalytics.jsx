import { useState, useEffect } from 'react';
import '../styles/admin-analytics.css';
import { adminFirebaseService } from '../utils/adminFirebaseService';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFirebaseService.getAnalytics(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!analytics) return <div className="error-message">Failed to load analytics data.</div>;

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <h2>Platform Analytics</h2>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-range-selector"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <div className="analytics-grid">
        <div className="metric-card">
          <h3>Total Users</h3>
          <div className="metric-value">{analytics.totalUsers.toLocaleString()}</div>
          <div className={`metric-change ${analytics.userGrowth >= 0 ? '' : 'negative'}`}>
            {analytics.userGrowth >= 0 ? '+' : ''}{analytics.userGrowth}% from last period
          </div>
        </div>

        <div className="metric-card">
          <h3>Active Users</h3>
          <div className="metric-value">{analytics.activeUsers.toLocaleString()}</div>
          <div className="metric-change">
            {Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}% of total users
          </div>
        </div>

        <div className="metric-card">
          <h3>Total Quizzes</h3>
          <div className="metric-value">{analytics.totalQuizzes.toLocaleString()}</div>
          <div className={`metric-change ${analytics.quizGrowth >= 0 ? '' : 'negative'}`}>
            {analytics.quizGrowth >= 0 ? '+' : ''}{analytics.quizGrowth}% from last period
          </div>
        </div>

        <div className="metric-card">
          <h3>API Success Rate</h3>
          <div className="metric-value">{analytics.apiSuccessRate}%</div>
          <div className="metric-change">{analytics.failedRequests} failures</div>
        </div>
      </div>

      <div className="analytics-details">
        <div className="detail-card">
          <h4>API Usage Breakdown</h4>
          <div className="api-stats">
            <div className="api-stat success">
              <span>Successful</span>
              <span>{analytics.apiUsage.successful.toLocaleString()}</span>
            </div>
            <div className="api-stat failed">
              <span>Failed</span>
              <span>{analytics.apiUsage.failed.toLocaleString()}</span>
            </div>
            <div className="api-stat rate-limited">
              <span>Rate Limited</span>
              <span>{analytics.apiUsage.rateLimited.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h4>Popular Subjects</h4>
          <div className="subject-list">
            {analytics.popularSubjects.map((subject, index) => (
              <div key={subject.name} className="subject-item">
                <span className="subject-rank">#{index + 1}</span>
                <span className="subject-name">{subject.name}</span>
                <span className="subject-count">{subject.count.toLocaleString()} quizzes</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;