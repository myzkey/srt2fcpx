import { describe, expect, it } from 'vitest'
import { parseSrt } from './srt/parser'
import { buildFcpxml } from './fcpxml/builder'
import { convertSrtToFcpxml } from './index'

describe('Performance Benchmarks', () => {
  // Performance thresholds (adjust based on expected performance)
  const PERFORMANCE_THRESHOLDS = {
    smallFile: { maxTime: 50, maxMemory: 10 }, // 50ms, 10MB
    mediumFile: { maxTime: 200, maxMemory: 50 }, // 200ms, 50MB
    largeFile: { maxTime: 1000, maxMemory: 200 }, // 1s, 200MB
    extraLargeFile: { maxTime: 5000, maxMemory: 500 } // 5s, 500MB
  }

  // Helper function to measure performance
  function measurePerformance<T>(operation: () => T): {
    result: T
    time: number
    memoryUsed: number
  } {
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }

    const startMemory = process.memoryUsage()
    const startTime = performance.now()

    const result = operation()

    const endTime = performance.now()
    const endMemory = process.memoryUsage()

    const time = endTime - startTime
    const memoryUsed = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024 // MB

    return { result, time, memoryUsed }
  }

  // Generate SRT content of specific size
  function generateSrtContent(subtitleCount: number, averageTextLength: number = 50): string {
    let srt = ''
    for (let i = 1; i <= subtitleCount; i++) {
      const startHour = String(Math.floor(i / 1440)).padStart(2, '0')
      const startMin = String(Math.floor((i % 1440) / 60)).padStart(2, '0')
      const startSec = String(i % 60).padStart(2, '0')
      const endSec = String((i % 60) + 3).padStart(2, '0')

      // Generate random text of specified length
      const text = 'Lorem ipsum dolor sit amet consectetur adipiscing elit '.repeat(
        Math.ceil(averageTextLength / 55)
      ).substring(0, averageTextLength)

      srt += `${i}
${startHour}:${startMin}:${startSec},000 --> ${startHour}:${startMin}:${endSec},000
${text}

`
    }
    return srt
  }

  describe('SRT Parsing Performance', () => {
    it('should parse small SRT files quickly (10 subtitles)', () => {
      const srtContent = generateSrtContent(10)

      const { result, time, memoryUsed } = measurePerformance(() => {
        return parseSrt(srtContent)
      })

      expect(result.cues).toHaveLength(10)
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.smallFile.maxTime)
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.smallFile.maxMemory)

      console.log(`Small file (10 subtitles): ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })

    it('should parse medium SRT files efficiently (100 subtitles)', () => {
      const srtContent = generateSrtContent(100)

      const { result, time, memoryUsed } = measurePerformance(() => {
        return parseSrt(srtContent)
      })

      expect(result.cues).toHaveLength(100)
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxTime)
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxMemory)

      console.log(`Medium file (100 subtitles): ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })

    it('should parse large SRT files reasonably (1000 subtitles)', () => {
      const srtContent = generateSrtContent(1000)

      const { result, time, memoryUsed } = measurePerformance(() => {
        return parseSrt(srtContent)
      })

      expect(result.cues).toHaveLength(1000)
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.largeFile.maxTime)
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.largeFile.maxMemory)

      console.log(`Large file (1000 subtitles): ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })

    it('should handle extra large SRT files (5000 subtitles)', () => {
      const srtContent = generateSrtContent(5000)

      const { result, time, memoryUsed } = measurePerformance(() => {
        return parseSrt(srtContent)
      })

      expect(result.cues).toHaveLength(5000)
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.extraLargeFile.maxTime)
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.extraLargeFile.maxMemory)

      console.log(`Extra large file (5000 subtitles): ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })
  })

  describe('FCPXML Generation Performance', () => {
    it('should build FCPXML quickly for small datasets', () => {
      const srtContent = generateSrtContent(10)
      const parsed = parseSrt(srtContent)

      const { time, memoryUsed } = measurePerformance(() => {
        return buildFcpxml(parsed.cues, {
          titleName: 'Performance Test',
          frameRate: 24,
          width: 1920,
          height: 1080
        })
      })

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.smallFile.maxTime)
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.smallFile.maxMemory)

      console.log(`FCPXML build (10 subtitles): ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })

    it('should build FCPXML efficiently for medium datasets', () => {
      const srtContent = generateSrtContent(100)
      const parsed = parseSrt(srtContent)

      const { time, memoryUsed } = measurePerformance(() => {
        return buildFcpxml(parsed.cues, {
          titleName: 'Performance Test',
          frameRate: 24,
          width: 1920,
          height: 1080
        })
      })

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxTime)
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxMemory)

      console.log(`FCPXML build (100 subtitles): ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })

    it('should build FCPXML reasonably for large datasets', () => {
      const srtContent = generateSrtContent(1000)
      const parsed = parseSrt(srtContent)

      const { time, memoryUsed } = measurePerformance(() => {
        return buildFcpxml(parsed.cues, {
          titleName: 'Performance Test',
          frameRate: 24,
          width: 1920,
          height: 1080
        })
      })

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.largeFile.maxTime)
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.largeFile.maxMemory)

      console.log(`FCPXML build (1000 subtitles): ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })
  })

  describe('End-to-End Conversion Performance', () => {
    it('should convert small SRT to FCPXML quickly', () => {
      const srtContent = generateSrtContent(10)

      const { time, memoryUsed } = measurePerformance(() => {
        return convertSrtToFcpxml(srtContent, {
          titleName: 'E2E Performance Test',
          frameRate: 24,
          width: 1920,
          height: 1080
        })
      })

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.smallFile.maxTime * 2) // Allow more time for full conversion
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.smallFile.maxMemory * 2)

      console.log(`E2E conversion (10 subtitles): ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })

    it('should convert medium SRT to FCPXML efficiently', () => {
      const srtContent = generateSrtContent(100)

      const { time, memoryUsed } = measurePerformance(() => {
        return convertSrtToFcpxml(srtContent, {
          titleName: 'E2E Performance Test',
          frameRate: 24,
          width: 1920,
          height: 1080
        })
      })

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxTime * 2)
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxMemory * 2)

      console.log(`E2E conversion (100 subtitles): ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })

    it('should convert large SRT to FCPXML reasonably', () => {
      const srtContent = generateSrtContent(1000)

      const { time, memoryUsed } = measurePerformance(() => {
        return convertSrtToFcpxml(srtContent, {
          titleName: 'E2E Performance Test',
          frameRate: 24,
          width: 1920,
          height: 1080
        })
      })

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.largeFile.maxTime * 2)
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.largeFile.maxMemory * 2)

      console.log(`E2E conversion (1000 subtitles): ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })
  })

  describe('Complex Content Performance', () => {
    it('should handle Unicode and emoji efficiently', () => {
      const complexSrt = generateSrtContent(100, 100).replace(
        /Lorem ipsum/g,
        'こんにちは 😀🌟 Complex Unicode ♪ عربي русский'
      )

      const { time, memoryUsed } = measurePerformance(() => {
        return convertSrtToFcpxml(complexSrt, {
          titleName: 'Unicode Performance Test',
          frameRate: 24,
          width: 1920,
          height: 1080
        })
      })

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxTime * 3) // Allow extra time for Unicode
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxMemory * 2)

      console.log(`Unicode content: ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })

    it('should handle HTML entities efficiently', () => {
      const entitySrt = generateSrtContent(100, 100).replace(
        /Lorem/g,
        '&amp;&lt;&gt;&quot;&#39;&copy;&trade;&euro;&pound;&yen;'
      )

      const { time, memoryUsed } = measurePerformance(() => {
        return convertSrtToFcpxml(entitySrt, {
          titleName: 'Entity Performance Test',
          frameRate: 24,
          width: 1920,
          height: 1080
        })
      })

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxTime * 3)
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxMemory * 2)

      console.log(`HTML entities: ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })

    it('should handle heavy HTML tag stripping efficiently', () => {
      const htmlSrt = generateSrtContent(100, 100).replace(
        /Lorem ipsum/g,
        '<b><i><u><font color="red">Heavily <span style="color:blue">nested</span> HTML</font></u></i></b>'
      )

      const { time, memoryUsed } = measurePerformance(() => {
        return convertSrtToFcpxml(htmlSrt, {
          titleName: 'HTML Performance Test',
          frameRate: 24,
          width: 1920,
          height: 1080
        })
      })

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxTime * 4) // Allow extra time for HTML processing
      expect(memoryUsed).toBeLessThan(PERFORMANCE_THRESHOLDS.mediumFile.maxMemory * 2)

      console.log(`Heavy HTML: ${time.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
    })
  })

  describe('Scalability Tests', () => {
    it('should show linear performance scaling', () => {
      const sizes = [10, 50, 100, 200, 500]
      const times: number[] = []

      for (const size of sizes) {
        const srtContent = generateSrtContent(size)

        const { time } = measurePerformance(() => {
          return convertSrtToFcpxml(srtContent, {
            titleName: `Scalability Test ${size}`,
            frameRate: 24,
            width: 1920,
            height: 1080
          })
        })

        times.push(time)
        console.log(`Size ${size}: ${time.toFixed(2)}ms`)
      }

      // Check that performance scales reasonably (not exponentially)
      // Each doubling should be less than 4x slower (allowing for some overhead)
      for (let i = 1; i < times.length; i++) {
        const ratio = times[i] / times[i - 1]
        const sizeRatio = sizes[i] / sizes[i - 1]

        expect(ratio).toBeLessThan(sizeRatio * 4) // Performance shouldn't degrade exponentially
      }
    })

    it('should handle memory efficiently without leaks', () => {
      const iterations = 10
      const initialMemory = process.memoryUsage().heapUsed

      for (let i = 0; i < iterations; i++) {
        const srtContent = generateSrtContent(100)
        convertSrtToFcpxml(srtContent, {
          titleName: `Memory Test ${i}`,
          frameRate: 24,
          width: 1920,
          height: 1080
        })

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024

      // Memory increase should be minimal (less than 50MB for 10 iterations)
      expect(memoryIncrease).toBeLessThan(50)

      console.log(`Memory increase after ${iterations} iterations: ${memoryIncrease.toFixed(2)}MB`)
    })
  })

  describe('Performance Regression Detection', () => {
    it('should maintain baseline parsing performance', () => {
      const baselineSrt = `1
00:00:01,000 --> 00:00:03,000
This is a baseline performance test subtitle.

2
00:00:04,000 --> 00:00:06,000
It should parse quickly and consistently.

3
00:00:07,000 --> 00:00:09,000
Any significant slowdown indicates a regression.`

      const iterations = 10
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const { time } = measurePerformance(() => {
          return parseSrt(baselineSrt)
        })
        times.push(time)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)

      // Baseline should be very fast
      expect(avgTime).toBeLessThan(5) // 5ms average
      expect(maxTime).toBeLessThan(20) // 20ms max

      // Performance should be consistent (low variance)
      const variance = times.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / times.length
      expect(variance).toBeLessThan(10) // Low variance

      console.log(`Baseline performance - Avg: ${avgTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`)
    })
  })
})