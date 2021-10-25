import { useRef, useEffect } from 'react'
import * as VRD from '../../src/index' // testing dir

type Props = {
  voices: VRD.Voice[]
  colors: string[]
}

export default function Visualization({ voices, colors }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	// const vowels = [
	// 	useRef<HTMLSpanElement>(null),
	// 	useRef<HTMLSpanElement>(null),
	// 	useRef<HTMLSpanElement>(null),
	// 	useRef<HTMLSpanElement>(null),
	// 	useRef<HTMLSpanElement>(null)
	// ]

  useEffect(() => draw())

	const draw = () => {
		requestAnimationFrame(draw)

		const canvas = canvasRef.current as HTMLCanvasElement
		const ctx = canvas.getContext('2d')!
		const scale = window.devicePixelRatio
		canvas.width = (window.innerWidth * scale) >> 0
		canvas.height = (window.innerHeight * scale) >> 0
		ctx.scale(scale, scale)

		ctx.lineWidth = 2
		ctx.imageSmoothingEnabled = false

		for (let i = 0; i < voices.length; i++) {
			const v = voices[i]
			ctx.strokeStyle = colors[i]
			ctx.fillStyle = colors[i] + '77'

			const analyser = v.analyser
			const bufferLength = v.bufferLength
			const dataArray = v.dataArray
			analyser.getByteFrequencyData(dataArray)

			const sliceWidth = canvas.width / bufferLength

			ctx.beginPath()
			ctx.moveTo(0, canvas.height)

			for (let n = 1, x = 0; n < bufferLength; n++) {
				const y = canvas.height / 2 - dataArray[n] + 3
				ctx.lineTo(x, y)
				x += sliceWidth
			}

			ctx.lineTo(canvas.width, canvas.height / 2)
			ctx.stroke()
			ctx.fill()
		}
	}

	return (
		<canvas
			ref={canvasRef}
			className="w-full h-full bg-gray-900"
		/>
	)
}
