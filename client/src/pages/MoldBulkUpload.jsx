import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { moldSpecificationAPI } from '../lib/api';
import * as XLSX from 'xlsx';

export default function MoldBulkUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  // 샘플 엑셀 다운로드
  const downloadSampleExcel = () => {
    const sampleData = [
      {
        '부품번호': 'P-2024-SAMPLE-001',
        '대표품번': '',
        '부품명': '프론트 범퍼',
        '차종': 'K5',
        '연식': '2024',
        '금형타입': '사출금형',
        'Cavity수': 1,
        '재질': 'NAK80',
        '톤수': 350,
        '제작처ID': 3,
        '생산처ID': 5,
        '개발단계': '개발',
        '생산단계': '시제',
        '발주일': '2024-01-15',
        '목표납기일': '2024-03-15',
        'ICMS비용': 45000000,
        '업체견적가': 42000000,
        '비고': '샘플 데이터'
      },
      {
        '부품번호': 'P-2024-SAMPLE-002',
        '대표품번': 'P-2024-SAMPLE-001',
        '부품명': '도어 트림 RH',
        '차종': 'K8',
        '연식': '2024',
        '금형타입': '사출금형',
        'Cavity수': 2,
        '재질': 'P20',
        '톤수': 420,
        '제작처ID': 3,
        '생산처ID': 5,
        '개발단계': '개발',
        '생산단계': '시제',
        '발주일': '2024-01-20',
        '목표납기일': '2024-03-20',
        'ICMS비용': 48000000,
        '업체견적가': 45000000,
        '비고': '샘플 데이터'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '금형목록');

    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 22 }, // 부품번호
      { wch: 22 }, // 대표품번
      { wch: 20 }, // 부품명
      { wch: 12 }, // 차종
      { wch: 8 },  // 연식
      { wch: 12 }, // 금형타입
      { wch: 10 }, // Cavity수
      { wch: 10 }, // 재질
      { wch: 8 },  // 톤수
      { wch: 10 }, // 제작처ID
      { wch: 10 }, // 생산처ID
      { wch: 10 }, // 개발단계
      { wch: 10 }, // 생산단계
      { wch: 12 }, // 발주일
      { wch: 12 }, // 목표납기일
      { wch: 15 }, // ICMS비용
      { wch: 15 }, // 업체견적가
      { wch: 20 }  // 비고
    ];

    XLSX.writeFile(wb, '금형_일괄등록_샘플.xlsx');
  };

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        alert('엑셀 파일만 업로드 가능합니다.');
        return;
      }
      setFile(selectedFile);
      setResults(null);
      setErrors([]);
    }
  };

  // 엑셀 파일 파싱
  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // 데이터 변환
  const transformData = (row, index) => {
    try {
      return {
        part_number: row['부품번호'],
        representative_part_number: row['대표품번'] || '',
        part_name: row['부품명'],
        car_model: row['차종'],
        car_year: String(row['연식'] || ''),
        mold_type: row['금형타입'],
        cavity_count: Number(row['Cavity수']) || 1,
        material: row['재질'],
        tonnage: Number(row['톤수']) || null,
        maker_company_id: Number(row['제작처ID']) || Number(row['목표제작처ID']) || null,
        plant_company_id: Number(row['생산처ID']) || null,
        development_stage: row['개발단계'] || '개발',
        production_stage: row['생산단계'] || '시제',
        order_date: row['발주일'],
        target_delivery_date: row['목표납기일'],
        icms_cost: Number(row['ICMS비용']) || Number(row['예상비용']) || null,
        vendor_quote_cost: Number(row['업체견적가']) || null,
        notes: row['비고'] || ''
      };
    } catch (error) {
      throw new Error(`${index + 1}번째 행 변환 실패: ${error.message}`);
    }
  };

  // 데이터 유효성 검사
  const validateData = (data) => {
    const errors = [];
    
    if (!data.part_number) errors.push('부품번호는 필수입니다');
    if (!data.part_name) errors.push('부품명은 필수입니다');
    if (!data.car_model) errors.push('차종은 필수입니다');
    if (data.cavity_count < 1) errors.push('Cavity수는 1 이상이어야 합니다');

    return errors;
  };

  // 파일 업로드 및 처리
  const handleUpload = async () => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setErrors([]);

    try {
      // 엑셀 파일 파싱
      const excelData = await parseExcelFile(file);
      
      if (excelData.length === 0) {
        alert('엑셀 파일에 데이터가 없습니다.');
        setUploading(false);
        return;
      }

      const uploadResults = {
        total: excelData.length,
        success: 0,
        failed: 0,
        errors: []
      };

      // 각 행 처리
      for (let i = 0; i < excelData.length; i++) {
        try {
          const transformedData = transformData(excelData[i], i);
          const validationErrors = validateData(transformedData);

          if (validationErrors.length > 0) {
            uploadResults.failed++;
            uploadResults.errors.push({
              row: i + 2, // 엑셀 행 번호 (헤더 포함)
              data: excelData[i],
              errors: validationErrors
            });
            continue;
          }

          // API 호출
          await moldSpecificationAPI.create(transformedData);
          uploadResults.success++;
        } catch (error) {
          uploadResults.failed++;
          uploadResults.errors.push({
            row: i + 2,
            data: excelData[i],
            errors: [error.response?.data?.error?.message || error.message]
          });
        }
      }

      setResults(uploadResults);
      setErrors(uploadResults.errors);

      if (uploadResults.success > 0) {
        alert(`${uploadResults.success}건의 금형이 성공적으로 등록되었습니다.`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('파일 처리 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">금형 일괄등록</h1>
        <p className="text-sm text-gray-600 mt-1">엑셀 파일을 이용하여 여러 금형을 한번에 등록할 수 있습니다.</p>
      </div>

      {/* 안내 사항 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="text-blue-600 mr-3 mt-0.5" size={20} />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-2">업로드 안내</p>
            <ul className="list-disc list-inside space-y-1">
              <li>엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.</li>
              <li>샘플 엑셀을 다운로드하여 형식에 맞게 작성해주세요.</li>
              <li>필수 항목: 부품번호, 부품명, 차종, 목표제작처ID, 목표납기일</li>
              <li>목표제작처ID는 3(A제작소) 또는 5(B제작소)를 입력하세요.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 샘플 다운로드 */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📥 샘플 엑셀 다운로드</h2>
        <p className="text-sm text-gray-600 mb-4">
          아래 버튼을 클릭하여 샘플 엑셀 파일을 다운로드하고, 형식에 맞게 데이터를 입력하세요.
        </p>
        <button
          onClick={downloadSampleExcel}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={20} />
          <span>샘플 엑셀 다운로드</span>
        </button>
      </div>

      {/* 파일 업로드 */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📤 파일 업로드</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileSpreadsheet className="mx-auto mb-4 text-gray-400" size={48} />
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload size={20} />
            <span>파일 선택</span>
          </label>
          {file && (
            <p className="mt-4 text-sm text-gray-600">
              선택된 파일: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        {file && (
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => {
                setFile(null);
                setResults(null);
                setErrors([]);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? '업로드 중...' : '업로드 시작'}
            </button>
          </div>
        )}
      </div>

      {/* 업로드 결과 */}
      {results && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 업로드 결과</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">전체</p>
              <p className="text-2xl font-bold text-gray-900">{results.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 mb-1">성공</p>
              <p className="text-2xl font-bold text-green-600">{results.success}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600 mb-1">실패</p>
              <p className="text-2xl font-bold text-red-600">{results.failed}</p>
            </div>
          </div>

          {errors.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">❌ 실패 항목</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {errors.map((error, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-medium text-red-900 mb-1">
                      {error.row}번째 행 - {error.data['부품번호'] || '부품번호 없음'}
                    </p>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {error.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => navigate('/molds')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              금형 목록으로 이동
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
