import { useCallback, useEffect, useMemo, useRef } from "react"

import {
  calculateBarData,
  drawAudioVisualizer,
} from "@/helpers/audioVisualizer"
import { getAudioContextClass } from "@/helpers/audioContext"

export default function useAudioVisualizer() {
  const visualizerConfig = useMemo(
    () => ({
      barGap: 2,
      barWidth: 4,
      bgColor: "#0980bf",
      barBg: "#f1f1f1",
      fftSize: 1024,
      maxDecibels: -10,
      minDecibels: -90,
      smoothingTimeConstant: 0.4,
    }),
    []
  )

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const bufferLengthRef = useRef<number | null>(null)
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const processFrequencyData = useCallback(
    (data: Uint8Array) => {
      if (!visualizerCanvasRef.current) return
      const dataPoints = calculateBarData(
        data,
        visualizerCanvasRef.current.width,
        visualizerConfig.barWidth,
        visualizerConfig.barGap
      )
      drawAudioVisualizer(
        dataPoints,
        visualizerCanvasRef.current,
        visualizerConfig.barWidth,
        visualizerConfig.barGap,
        visualizerConfig.bgColor,
        visualizerConfig.barBg
      )
    },
    [visualizerConfig]
  )

  const initAudioContext = useCallback(
    (stream: MediaStream) => {
      const AudioContextClass = getAudioContextClass()
      const audioContext = new AudioContextClass()
      const analyserNode = audioContext.createAnalyser()
      analyserNode.fftSize = visualizerConfig.fftSize
      analyserNode.minDecibels = visualizerConfig.minDecibels
      analyserNode.maxDecibels = visualizerConfig.maxDecibels
      analyserNode.smoothingTimeConstant =
        visualizerConfig.smoothingTimeConstant

      const bufferLength = analyserNode.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      audioContextRef.current = audioContext
      analyserRef.current = analyserNode
      bufferLengthRef.current = bufferLength
      dataArrayRef.current = dataArray

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyserNode)

      const report = () => {
        if (!analyserRef.current) return
        const data = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(data)
        processFrequencyData(data)
        requestAnimationFrame(report)
      }

      requestAnimationFrame(report)
    },
    [processFrequencyData, visualizerConfig]
  )

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return {
    visualizerCanvasRef,
    initAudioContext,
    visualizerConfig,
  }
}
