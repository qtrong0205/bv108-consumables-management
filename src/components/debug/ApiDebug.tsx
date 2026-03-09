import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ApiDebug() {
  const [apiUrl, setApiUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    setApiUrl(url);
    console.log('🔧 API URL từ env:', url);
  }, []);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Test health endpoint
      const healthUrl = apiUrl.replace('/api', '');
      console.log('🧪 Testing:', `${healthUrl}/health`);
      
      const response = await fetch(`${healthUrl}/health`);
      
      if (response.ok) {
        const data = await response.json();
        setResult({ 
          success: true, 
          message: `✅ Kết nối thành công! ${data.message || ''}` 
        });
      } else {
        setResult({ 
          success: false, 
          message: `❌ Lỗi HTTP ${response.status}: ${response.statusText}` 
        });
      }
    } catch (error) {
      console.error('❌ Lỗi test connection:', error);
      setResult({ 
        success: false, 
        message: `❌ Không thể kết nối: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="mb-4 bg-neutral border-border">
      <CardHeader>
        <CardTitle className="text-sm">🔧 Debug API Connection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs">
          <div className="text-muted-foreground">API URL:</div>
          <div className="font-mono bg-tertiary p-2 rounded mt-1">{apiUrl}</div>
        </div>

        <Button 
          onClick={testConnection} 
          disabled={testing}
          size="sm"
          variant="outline"
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang kiểm tra...
            </>
          ) : (
            'Test Kết Nối'
          )}
        </Button>

        {result && (
          <div className={`flex items-start gap-2 p-3 rounded text-xs ${
            result.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
          }`}>
            {result.success ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <div>{result.message}</div>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          <div className="font-medium mb-1">Hướng dẫn:</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Đảm bảo backend đang chạy tại port 8080</li>
            <li>Mở DevTools (F12) và xem tab Console</li>
            <li>Kiểm tra tab Network để xem request details</li>
            <li>Nếu gặp lỗi CORS, cần cấu hình lại backend</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
