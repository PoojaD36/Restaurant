'use client';

import { useState } from 'react';
import { ProtectedRoute } from '../../../components/protected-route';
import { sendTestEmail, getDailyReportInfo } from '../../../lib/email-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Mail, Calendar, Clock, MapPin, Loader2, CheckCircle, Send, Info } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';

export default function EmailTestPage() {
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isLoadingReportInfo, setIsLoadingReportInfo] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState(false);
  const [testEmailError, setTestEmailError] = useState('');
  const [reportInfo, setReportInfo] = useState<{
    scheduler: string;
    schedule: string;
    timezone: string;
  } | null>(null);
  const [reportInfoError, setReportInfoError] = useState('');

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    setTestEmailSuccess(false);
    setTestEmailError('');

    try {
      await sendTestEmail();
      setTestEmailSuccess(true);
      setTimeout(() => setTestEmailSuccess(false), 5000);
    } catch (err) {
      setTestEmailError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleGetReportInfo = async () => {
    setIsLoadingReportInfo(true);
    setReportInfoError('');

    try {
      const response = await getDailyReportInfo();
      setReportInfo(response.data as typeof reportInfo);
    } catch (err) {
      setReportInfoError(err instanceof Error ? err.message : 'Failed to get report info');
    } finally {
      setIsLoadingReportInfo(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN">
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Email Management
          </h2>
          <p className="text-slate-600">
            Test email configuration and view email scheduler information.
          </p>
        </div>

        {/* Test Email Card */}
        <Card className="border-emerald-100 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-500" />
              Test Email Configuration
            </CardTitle>
            <CardDescription className="text-slate-600">
              Send a test email to verify your SMTP settings are working correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    This will send a test email to the address configured in <code>EMAIL_TO</code> environment variable.
                  </p>
                </div>
              </div>

              {testEmailSuccess && (
                <div className="rounded-md bg-green-50 p-4 border border-green-200 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700">Test email sent successfully! Check your inbox.</p>
                </div>
              )}

              {testEmailError && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <p className="text-sm text-red-600">{testEmailError}</p>
                </div>
              )}

              <Button
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail}
                className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
              >
                {isSendingTestEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Daily Report Scheduler Card */}
        <Card className="border-emerald-100 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              Daily Sales Report Scheduler
            </CardTitle>
            <CardDescription className="text-slate-600">
              View information about the automated daily sales report email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    The daily sales report is sent automatically at <strong>8 AM daily</strong> (Asia/Kolkata timezone).
                  </p>
                </div>
              </div>

              {reportInfoError && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <p className="text-sm text-red-600">{reportInfoError}</p>
                </div>
              )}

              {reportInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Mail className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Scheduler</p>
                        <p className="text-sm font-semibold text-slate-700">{reportInfo.scheduler}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Schedule</p>
                        <p className="text-sm font-semibold text-slate-700">{reportInfo.schedule}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Timezone</p>
                        <p className="text-sm font-semibold text-slate-700">{reportInfo.timezone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md bg-green-50 p-4 border border-green-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-700 mb-1">Report Content</p>
                        <p className="text-xs text-green-600">
                          The daily sales report includes: total revenue, order count, average order value, payment breakdown, order status distribution, top selling items, restaurant performance, and recent orders.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleGetReportInfo}
                  disabled={isLoadingReportInfo}
                  variant="outline"
                  className="border-emerald-200 text-slate-700 hover:bg-emerald-50"
                >
                  {isLoadingReportInfo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'View Scheduler Information'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Templates Info Card */}
        <Card className="border-emerald-100 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-500" />
              Email Templates
            </CardTitle>
            <CardDescription className="text-slate-600">
              Available email templates in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700">Daily Sales Report</h4>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Automated daily sales summary sent at 8 AM with revenue analytics and order statistics.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700">Order Confirmation</h4>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Ready
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Sent to customers when they place an order with order details and status tracking.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700">Welcome Email</h4>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Ready
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Sent to new customers upon registration with a welcome message and first-order coupon.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700">Order Status Update</h4>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Ready
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Sent to customers when their order status changes with timeline progress.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700">Test Email</h4>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Testing
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Simple template for testing SMTP configuration and email delivery.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
