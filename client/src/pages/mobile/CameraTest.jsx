import { useEffect, useRef, useState } from 'react'

export default function CameraTest() {
  const videoRef = useRef(null)
  const [status, setStatus] = useState('초기화 중...')
  const [details, setDetails] = useState([])

  const log = (msg) => {
    setDetails(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`])
  }

  useEffect(() => {
    let stream

    async function run() {
      log(`URL: ${location.href}`)
      log(`isSecureContext: ${window.isSecureContext}`)
      log(`mediaDevices: ${!!navigator.mediaDevices}`)
      log(`getUserMedia: ${!!navigator.mediaDevices?.getUserMedia}`)

      if (!window.isSecureContext) {
        setStatus('HTTPS가 아닙니다!')
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('카메라 API 미지원')
        return
      }

      try {
        setStatus('카메라 권한 요청 중...')
        log('getUserMedia 호출...')

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })

        log(`스트림 성공: ${stream.id}`)
        const tracks = stream.getVideoTracks()
        tracks.forEach((t, i) => {
          log(`트랙${i}: ${t.label} / ${t.readyState} / enabled=${t.enabled}`)
        })

        const video = videoRef.current
        if (!video) {
          setStatus('videoRef가 null!')
          log('ERROR: videoRef.current is null')
          return
        }

        video.srcObject = stream
        video.muted = true
        video.playsInline = true
        log('srcObject 설정 완료')

        await video.play()
        log(`play() 성공`)
        log(`videoWidth: ${video.videoWidth}`)
        log(`videoHeight: ${video.videoHeight}`)

        if (video.videoWidth > 0) {
          setStatus(`카메라 정상! (${video.videoWidth}x${video.videoHeight})`)
        } else {
          setStatus('play() 성공했지만 영상 크기가 0')
        }
      } catch (err) {
        setStatus(`에러: ${err.name}`)
        log(`ERROR: ${err.name}: ${err.message}`)
      }
    }

    run()

    return () => {
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '16px' }}>
      <h1 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>카메라 테스트</h1>
      <p style={{ color: status.includes('정상') ? '#4ade80' : status.includes('에러') ? '#f87171' : '#fbbf24', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
        {status}
      </p>

      {/* 비디오 — 오버레이 없음, 순수 video만 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', height: '50vh', objectFit: 'cover', borderRadius: '12px', background: '#333' }}
      />

      {/* 디버그 로그 */}
      <div style={{ marginTop: '16px', padding: '12px', background: '#111', borderRadius: '8px', maxHeight: '30vh', overflow: 'auto' }}>
        {details.map((d, i) => (
          <p key={i} style={{ color: d.includes('ERROR') ? '#f87171' : '#9ca3af', fontSize: '11px', fontFamily: 'monospace', margin: '2px 0' }}>{d}</p>
        ))}
      </div>
    </div>
  )
}
