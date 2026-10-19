import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { createCursorController } from './core'
import type {
  ClickOptions,
  CursorController,
  MotionStyle,
  MouseButton,
  MoveToOptions,
  Point,
  ShapeName,
} from './core'

export interface PointingCursorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  size?: string
  shape?: ShapeName
  stroke?: string
  fill?: string
  visible?: boolean
  followMouse?: boolean
  hideNativeCursor?: boolean
  x?: number
  y?: number
  hotspotX?: number
  hotspotY?: number
  zIndex?: number
  minDuration?: number
  maxDuration?: number
  motionStyle?: MotionStyle
  defaultAngle?: number
  mirrorNativeClicks?: boolean
  clickAnimationDuration?: number
  clickBurst?: boolean
  clickBurstStrokeWidth?: number | string
  clickBurstSize?: string
  clickBurstDurationMs?: number
  clickBurstLeftColor?: string
  clickBurstRightColor?: string
  clickBurstColor?: string
  emitMoveFrames?: boolean
  onMove?: (point: Point) => void
  onShow?: () => void
  onHide?: () => void
  children?: (ctx: {
    pressed: boolean
    button: MouseButton | null
    stroke: string
    fill: string
  }) => ReactNode
}

export interface PointingCursorHandle {
  show(): void
  hide(): void
  moveTo(
    target: number | string | Element,
    yOrOptions?: number | MoveToOptions,
    maybeOptions?: MoveToOptions,
  ): Promise<void>
  setFollow(enabled: boolean): void
  getPosition(): Point
  click(options?: ClickOptions): Promise<void>
  clickAt(
    target: number | string | Element,
    yOrOptions?: number | ClickOptions,
    maybeOptions?: ClickOptions,
  ): Promise<void>
  leftClick(options?: Omit<ClickOptions, 'button'>): Promise<void>
  rightClick(options?: Omit<ClickOptions, 'button'>): Promise<void>
  setMotionStyle(style: MotionStyle): void
}

export const PointingCursor = forwardRef<PointingCursorHandle, PointingCursorProps>(
  function PointingCursor(props, ref) {
    const {
      size = '3em',
      shape = 'arrow',
      stroke = '#000000',
      fill = '#ffffff',
      visible = true,
      followMouse = false,
      hideNativeCursor = false,
      x,
      y,
      hotspotX,
      hotspotY,
      zIndex = 9999,
      minDuration = 280,
      maxDuration = 900,
      motionStyle = 'dangling',
      defaultAngle,
      mirrorNativeClicks = true,
      clickAnimationDuration = 120,
      clickBurst = true,
      clickBurstStrokeWidth = 2,
      clickBurstSize = '2.25em',
      clickBurstDurationMs = 420,
      clickBurstLeftColor = '#22c55e',
      clickBurstRightColor = '#ef4444',
      clickBurstColor = '#111111',
      emitMoveFrames = false,
      className,
      style,
      onMove,
      onShow,
      onHide,
      children,
      ...rest
    } = props

    const rootRef = useRef<HTMLDivElement | null>(null)
    const innerRef = useRef<HTMLDivElement | null>(null)
    const controllerRef = useRef<CursorController | null>(null)
    const [isVisible, setIsVisible] = useState(visible)
    const [pressed, setPressed] = useState(false)
    const [button, setButton] = useState<MouseButton | null>(null)
    const [shapeMarkup, setShapeMarkup] = useState('')
    const [shapePaint, setShapePaint] = useState<Record<string, string>>({})

    const onMoveRef = useRef(onMove)
    const onShowRef = useRef(onShow)
    const onHideRef = useRef(onHide)
    onMoveRef.current = onMove
    onShowRef.current = onShow
    onHideRef.current = onHide

    useEffect(() => {
      const controller = createCursorController(
        {
          getRootEl: () => rootRef.current,
          getInnerEl: () => innerRef.current,
          onMove: (point) => onMoveRef.current?.(point),
          onShow: () => onShowRef.current?.(),
          onHide: () => onHideRef.current?.(),
          onVisibilityChange: setIsVisible,
          onInteractionChange: (snap) => {
            setPressed(snap.pressed)
            setButton(snap.button)
          },
        },
        {
          size,
          shape,
          stroke,
          fill,
          visible,
          followMouse,
          hideNativeCursor,
          x,
          y,
          hotspotX,
          hotspotY,
          zIndex,
          minDuration,
          maxDuration,
          motionStyle,
          defaultAngle,
          mirrorNativeClicks,
          clickAnimationDuration,
          clickBurst,
          clickBurstStrokeWidth,
          clickBurstSize,
          clickBurstDurationMs,
          clickBurstLeftColor,
          clickBurstRightColor,
          clickBurstColor,
          emitMoveFrames,
        },
      )
      controllerRef.current = controller
      controller.mount()
      setShapeMarkup(controller.getShapeMarkup())
      setShapePaint(controller.getShapePaintStyle())
      return () => {
        controller.destroy()
        controllerRef.current = null
      }
      // Mount once; options synced below.
    }, [])

    useEffect(() => {
      const c = controllerRef.current
      if (!c) return
      c.setOptions({
        size,
        shape,
        stroke,
        fill,
        visible,
        followMouse,
        hideNativeCursor,
        x,
        y,
        hotspotX,
        hotspotY,
        zIndex,
        minDuration,
        maxDuration,
        motionStyle,
        defaultAngle,
        mirrorNativeClicks,
        clickAnimationDuration,
        clickBurst,
        clickBurstStrokeWidth,
        clickBurstSize,
        clickBurstDurationMs,
        clickBurstLeftColor,
        clickBurstRightColor,
        clickBurstColor,
        emitMoveFrames,
      })
      setShapeMarkup(c.getShapeMarkup())
      setShapePaint(c.getShapePaintStyle())
    }, [
      size,
      shape,
      stroke,
      fill,
      visible,
      followMouse,
      hideNativeCursor,
      x,
      y,
      hotspotX,
      hotspotY,
      zIndex,
      minDuration,
      maxDuration,
      motionStyle,
      defaultAngle,
      mirrorNativeClicks,
      clickAnimationDuration,
      clickBurst,
      clickBurstStrokeWidth,
      clickBurstSize,
      clickBurstDurationMs,
      clickBurstLeftColor,
      clickBurstRightColor,
      clickBurstColor,
      emitMoveFrames,
    ])

    useImperativeHandle(ref, () => ({
      show: () => controllerRef.current?.show(),
      hide: () => controllerRef.current?.hide(),
      moveTo: (t, a, b) => controllerRef.current!.moveTo(t, a, b),
      setFollow: (enabled) => controllerRef.current?.setFollow(enabled),
      getPosition: () =>
        controllerRef.current?.getPosition() ?? { x: 0, y: 0 },
      click: (o) => controllerRef.current!.click(o),
      clickAt: (t, a, b) => controllerRef.current!.clickAt(t, a, b),
      leftClick: (o) => controllerRef.current!.leftClick(o),
      rightClick: (o) => controllerRef.current!.rightClick(o),
      setMotionStyle: (s) => controllerRef.current?.setMotionStyle(s),
    }))

    const outerStyle = useMemo(
      (): CSSProperties => ({
        position: 'fixed',
        left: 0,
        top: 0,
        width: size,
        height: size,
        zIndex,
        pointerEvents: 'none',
        ...style,
      }),
      [size, zIndex, style],
    )

    const classNames = [
      'pointing-cursor',
      `pointing-cursor--${shape}`,
      !isVisible ? 'pointing-cursor--hidden' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        ref={rootRef}
        className={classNames}
        style={outerStyle}
        aria-hidden
        {...rest}
      >
        <div ref={innerRef} className="pointing-cursor__inner">
          {children ? (
            children({
              pressed,
              button,
              stroke,
              fill,
            })
          ) : (
            <div
              className="pointing-cursor__shape"
              data-pressed={pressed ? 'true' : 'false'}
              data-button={button ?? undefined}
              style={shapePaint}
              dangerouslySetInnerHTML={{ __html: shapeMarkup }}
            />
          )}
        </div>
      </div>
    )
  },
)

PointingCursor.displayName = 'PointingCursor'
