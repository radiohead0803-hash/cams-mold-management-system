const { Mold, MoldLocationLog, Plant } = require('../models');
const { calculateDistanceM, isValidCoordinate } = require('../utils/geo');
const { notifyAdmins } = require('../services/notificationService');

// 위치 이탈 판정 기준 (미터)
const MOVE_THRESHOLD_M = 300; // 300m 이상이면 '이탈'로 간주

/**
 * QR 스캔 후 금형 위치 업데이트
 * POST /api/v1/mobile/molds/:moldId/location
 */
exports.updateMoldLocation = async (req, res) => {
  try {
    const { moldId } = req.params;
    // latitude/longitude 또는 gpsLat/gpsLng 둘 다 지원
    const gpsLat = req.body.gpsLat || req.body.latitude;
    const gpsLng = req.body.gpsLng || req.body.longitude;
    const { source = 'qr_scan', notes, scanned_by, scanned_at, device_info, accuracy } = req.body;
    const user = req.user; // authMiddleware에서 주입

    // 입력 검증
    if (!gpsLat || !gpsLng) {
      return res.status(400).json({
        success: false,
        message: 'gpsLat/latitude, gpsLng/longitude 값이 필요합니다.'
      });
    }

    if (!isValidCoordinate(Number(gpsLat), Number(gpsLng))) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 GPS 좌표입니다.'
      });
    }

    // 금형 조회
    const mold = await Mold.findByPk(moldId);

    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '금형을 찾을 수 없습니다.'
      });
    }

    // 기준 위치 결정 (우선순위: base_gps > plant GPS)
    let baseLat = mold.base_gps_lat;
    let baseLng = mold.base_gps_lng;

    // 기준 GPS가 없으면 생산처 GPS 사용
    if (!baseLat || !baseLng) {
      if (mold.plant_id) {
        const plant = await Plant.findByPk(mold.plant_id);
        if (plant) {
          baseLat = plant.gps_lat;
          baseLng = plant.gps_lng;
        }
      }
    }

    let distance = null;
    let status = 'normal';

    // 기준 위치가 있으면 거리 계산
    if (baseLat && baseLng) {
      distance = Math.round(calculateDistanceM(
        Number(baseLat),
        Number(baseLng),
        Number(gpsLat),
        Number(gpsLng)
      ));

      // 이탈 판정
      if (distance > MOVE_THRESHOLD_M) {
        status = 'moved';
      }
    } else {
      // 기준 위치가 없으면 unknown
      status = 'unknown';
    }

    // 1) 위치 로그 기록
    const locationLog = await MoldLocationLog.create({
      mold_id: mold.id,
      plant_id: mold.plant_id,
      scanned_by_id: user?.id,
      scanned_at: new Date(),
      gps_lat: gpsLat,
      gps_lng: gpsLng,
      distance_m: distance,
      status,
      source,
      notes
    });

    // 2) 금형 현재 위치 업데이트
    await mold.update({
      last_gps_lat: gpsLat,
      last_gps_lng: gpsLng,
      last_gps_time: new Date(),
      location_status: status
    });

    // 3) 위치 이탈 시 알림 생성
    if (status === 'moved') {
      console.log(`[GPS Alert] 금형 ${mold.mold_code} 위치 이탈 감지: ${distance}m`);
      
      // 시스템 관리자에게 알림 전송
      await notifyAdmins({
        type: 'location_moved',
        title: `금형 위치 이탈: ${mold.mold_code}`,
        message: `${mold.mold_code} (${mold.mold_name || '이름 없음'}) 금형이 기준 위치에서 ${distance}m 떨어진 곳에서 스캔되었습니다.`,
        moldId: mold.id,
        priority: distance > 1000 ? 'urgent' : 'high'
      });
    } else if (status === 'normal' && distance && distance < MOVE_THRESHOLD_M) {
      // 이전에 이탈 상태였다가 복귀한 경우
      const prevLog = await MoldLocationLog.findOne({
        where: { mold_id: mold.id },
        order: [['scanned_at', 'DESC']],
        offset: 1 // 방금 생성한 로그 제외
      });
      
      if (prevLog && prevLog.status === 'moved') {
        console.log(`[GPS Alert] 금형 ${mold.mold_code} 위치 복귀`);
        
        await notifyAdmins({
          type: 'location_back',
          title: `금형 위치 복귀: ${mold.mold_code}`,
          message: `${mold.mold_code} (${mold.mold_name || '이름 없음'}) 금형이 기준 위치로 복귀되었습니다.`,
          moldId: mold.id,
          priority: 'normal'
        });
      }
    }

    return res.json({
      success: true,
      data: {
        moldId: mold.id,
        moldCode: mold.mold_code,
        status,
        distanceM: distance,
        threshold: MOVE_THRESHOLD_M,
        locationLogId: locationLog.id,
        message: status === 'moved' 
          ? `위치 이탈 감지 (${distance}m)` 
          : status === 'unknown'
          ? '기준 위치 미등록'
          : '정상 위치'
      }
    });

  } catch (err) {
    console.error('[updateMoldLocation] error:', err);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * 금형 위치 로그 조회
 * GET /api/v1/mobile/molds/:moldId/location-logs
 */
exports.getMoldLocationLogs = async (req, res) => {
  try {
    const { moldId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const logs = await MoldLocationLog.findAll({
      where: { mold_id: moldId },
      order: [['scanned_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Plant,
          as: 'plant',
          attributes: ['id', 'name', 'gps_lat', 'gps_lng']
        }
      ]
    });

    return res.json({
      success: true,
      data: {
        logs,
        count: logs.length
      }
    });

  } catch (err) {
    console.error('[getMoldLocationLogs] error:', err);
    return res.status(500).json({
      success: false,
      message: '위치 로그를 불러올 수 없습니다.'
    });
  }
};
