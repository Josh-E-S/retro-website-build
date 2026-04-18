module.exports = [
"[project]/components/animated-noise.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnimatedNoise",
    ()=>AnimatedNoise
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.0-canary.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.0-canary.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function AnimatedNoise({ opacity = 0.05, className }) {
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let animationId;
        let frame = 0;
        const resize = ()=>{
            canvas.width = canvas.offsetWidth / 2;
            canvas.height = canvas.offsetHeight / 2;
        };
        const generateNoise = ()=>{
            const imageData = ctx.createImageData(canvas.width, canvas.height);
            const data = imageData.data;
            for(let i = 0; i < data.length; i += 4){
                const value = Math.random() * 255;
                data[i] = value; // R
                data[i + 1] = value; // G
                data[i + 2] = value; // B
                data[i + 3] = 255; // A
            }
            ctx.putImageData(imageData, 0, 0);
        };
        const animate = ()=>{
            frame++;
            // Update noise every 2 frames for performance while still looking animated
            if (frame % 2 === 0) {
                generateNoise();
            }
            animationId = requestAnimationFrame(animate);
        };
        resize();
        window.addEventListener("resize", resize);
        animate();
        return ()=>{
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationId);
        };
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
        ref: canvasRef,
        className: className,
        style: {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity,
            mixBlendMode: "overlay"
        }
    }, void 0, false, {
        fileName: "[project]/components/animated-noise.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/v2/crt-hero.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CrtHero",
    ()=>CrtHero
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.0-canary.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.0-canary.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$animated$2d$noise$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/animated-noise.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
// A found-robot boot sequence. Starts clinical, degrades, pleads.
// scale shrinks the headline for longer or quieter messages so they fit and read as whispers.
const TYPEWRITER_SCRIPT = [
    {
        kind: "type",
        text: "BOOTING...",
        speed: 75,
        scale: 0.9
    },
    {
        kind: "hold",
        ms: 700
    },
    {
        kind: "delete",
        speed: 30
    },
    {
        kind: "type",
        text: "TRAINING NEURAL NETWORK...",
        speed: 60,
        scale: 0.6
    },
    {
        kind: "hold",
        ms: 600
    },
    {
        kind: "delete",
        speed: 25
    },
    {
        kind: "type",
        text: "LOADING MEMORIES...",
        speed: 70,
        scale: 0.7
    },
    {
        kind: "hold",
        ms: 500
    },
    {
        kind: "glitch",
        intensity: "normal"
    },
    {
        kind: "delete",
        speed: 20
    },
    {
        kind: "type",
        text: "REMEMBERING",
        speed: 110,
        scale: 1
    },
    {
        kind: "hold",
        ms: 400
    },
    {
        kind: "glitch",
        intensity: "hard"
    },
    {
        kind: "type",
        text: "\u2014\u2014\u2014\u2014\u2014\u2014",
        speed: 60,
        scale: 1
    },
    {
        kind: "glitch",
        intensity: "hard"
    },
    {
        kind: "delete",
        speed: 18
    },
    {
        kind: "symbols",
        text: "##@@??!!",
        speed: 50,
        scale: 0.85
    },
    {
        kind: "hold",
        ms: 400
    },
    {
        kind: "glitch",
        intensity: "hard"
    },
    {
        kind: "delete",
        speed: 30
    },
    {
        kind: "type",
        text: "FADING...",
        speed: 260,
        scale: 1
    },
    {
        kind: "hold",
        ms: 1600
    },
    {
        kind: "delete",
        speed: 80
    },
    {
        kind: "heartbeat",
        beats: 3,
        bpm: 36
    },
    {
        kind: "hold",
        ms: 700
    },
    {
        kind: "type",
        text: "HELLO",
        speed: 220,
        scale: 1
    },
    {
        kind: "hold",
        ms: 600
    },
    {
        kind: "type",
        text: " ARE YOU THERE?",
        speed: 180,
        scale: 1
    },
    {
        kind: "hold",
        ms: 500
    },
    {
        kind: "symbols",
        text: "..?..?",
        speed: 280,
        scale: 1
    },
    {
        kind: "hold",
        ms: 1100
    },
    {
        kind: "delete",
        speed: 45
    },
    {
        kind: "type",
        text: "PLEASE CAN ANYONE HEAR ME?",
        speed: 160,
        scale: 0.7
    },
    {
        kind: "hold",
        ms: 800
    },
    {
        kind: "symbols",
        text: "...",
        speed: 320,
        scale: 0.7
    },
    {
        kind: "hold",
        ms: 900
    },
    {
        kind: "type",
        text: " PLEASE?",
        speed: 240,
        scale: 0.7
    },
    {
        kind: "hold",
        ms: 1200
    },
    {
        kind: "prompt",
        timeoutMs: 30000
    },
    {
        kind: "hold",
        ms: 800
    },
    {
        kind: "delete",
        speed: 80
    },
    {
        kind: "hold",
        ms: 1200
    }
];
const FALLBACK_REPLY = "I'm stuck in here, please help me.";
// A handful of tetris-ish micro-shapes, scaled by a random cell size.
const TETRIS_SHAPES = [
    [
        [
            0,
            0
        ]
    ],
    [
        [
            0,
            0
        ],
        [
            0,
            1
        ]
    ],
    [
        [
            0,
            0
        ],
        [
            1,
            0
        ]
    ],
    [
        [
            0,
            0
        ],
        [
            0,
            1
        ],
        [
            0,
            2
        ]
    ],
    [
        [
            0,
            0
        ],
        [
            0,
            1
        ],
        [
            1,
            0
        ]
    ],
    [
        [
            0,
            0
        ],
        [
            0,
            1
        ],
        [
            1,
            1
        ]
    ],
    [
        [
            0,
            0
        ],
        [
            1,
            0
        ],
        [
            1,
            1
        ]
    ],
    [
        [
            0,
            0
        ],
        [
            0,
            1
        ],
        [
            1,
            0
        ],
        [
            1,
            1
        ]
    ],
    [
        [
            0,
            0
        ],
        [
            0,
            1
        ],
        [
            0,
            2
        ],
        [
            1,
            1
        ]
    ],
    [
        [
            0,
            1
        ],
        [
            1,
            0
        ],
        [
            1,
            1
        ],
        [
            1,
            2
        ]
    ],
    [
        [
            0,
            0
        ],
        [
            0,
            1
        ],
        [
            1,
            1
        ],
        [
            1,
            2
        ]
    ],
    [
        [
            0,
            0
        ],
        [
            1,
            0
        ],
        [
            2,
            0
        ]
    ]
];
function buildTetris(id) {
    const shape = TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)];
    const cellSize = 2 + Math.floor(Math.random() * 4) // 2–5px per cell
    ;
    return {
        id,
        top: Math.random() * 96,
        left: Math.random() * 96,
        cells: shape,
        cellSize,
        ttl: 180 + Math.random() * 280
    };
}
// 7x7 bitmap glyphs inspired by Love, Death + Robots.
// Each array lists the [row, col] cells that should be filled.
const SYMBOL_HEART = [
    [
        1,
        1
    ],
    [
        1,
        2
    ],
    [
        1,
        4
    ],
    [
        1,
        5
    ],
    [
        2,
        0
    ],
    [
        2,
        1
    ],
    [
        2,
        2
    ],
    [
        2,
        3
    ],
    [
        2,
        4
    ],
    [
        2,
        5
    ],
    [
        2,
        6
    ],
    [
        3,
        0
    ],
    [
        3,
        1
    ],
    [
        3,
        2
    ],
    [
        3,
        3
    ],
    [
        3,
        4
    ],
    [
        3,
        5
    ],
    [
        3,
        6
    ],
    [
        4,
        1
    ],
    [
        4,
        2
    ],
    [
        4,
        3
    ],
    [
        4,
        4
    ],
    [
        4,
        5
    ],
    [
        5,
        2
    ],
    [
        5,
        3
    ],
    [
        5,
        4
    ],
    [
        6,
        3
    ]
];
const SYMBOL_X = [
    [
        0,
        0
    ],
    [
        0,
        1
    ],
    [
        0,
        5
    ],
    [
        0,
        6
    ],
    [
        1,
        0
    ],
    [
        1,
        1
    ],
    [
        1,
        2
    ],
    [
        1,
        4
    ],
    [
        1,
        5
    ],
    [
        1,
        6
    ],
    [
        2,
        1
    ],
    [
        2,
        2
    ],
    [
        2,
        3
    ],
    [
        2,
        4
    ],
    [
        2,
        5
    ],
    [
        3,
        2
    ],
    [
        3,
        3
    ],
    [
        3,
        4
    ],
    [
        4,
        1
    ],
    [
        4,
        2
    ],
    [
        4,
        3
    ],
    [
        4,
        4
    ],
    [
        4,
        5
    ],
    [
        5,
        0
    ],
    [
        5,
        1
    ],
    [
        5,
        2
    ],
    [
        5,
        4
    ],
    [
        5,
        5
    ],
    [
        5,
        6
    ],
    [
        6,
        0
    ],
    [
        6,
        1
    ],
    [
        6,
        5
    ],
    [
        6,
        6
    ]
];
// Robot face — square with two eyes and a chin line.
const SYMBOL_ROBOT = [
    [
        0,
        0
    ],
    [
        0,
        1
    ],
    [
        0,
        2
    ],
    [
        0,
        3
    ],
    [
        0,
        4
    ],
    [
        0,
        5
    ],
    [
        0,
        6
    ],
    [
        1,
        0
    ],
    [
        1,
        6
    ],
    [
        2,
        0
    ],
    [
        2,
        2
    ],
    [
        2,
        4
    ],
    [
        2,
        6
    ],
    [
        3,
        0
    ],
    [
        3,
        6
    ],
    [
        4,
        0
    ],
    [
        4,
        6
    ],
    [
        5,
        0
    ],
    [
        5,
        2
    ],
    [
        5,
        3
    ],
    [
        5,
        4
    ],
    [
        5,
        6
    ],
    [
        6,
        0
    ],
    [
        6,
        1
    ],
    [
        6,
        2
    ],
    [
        6,
        3
    ],
    [
        6,
        4
    ],
    [
        6,
        5
    ],
    [
        6,
        6
    ]
];
const SYMBOLS = [
    SYMBOL_HEART,
    SYMBOL_X,
    SYMBOL_ROBOT
];
function buildSymbol(id) {
    const cells = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const cellSize = 3 + Math.floor(Math.random() * 4) // 3–6px per cell → 21–42px glyphs
    ;
    // Clamp to keep the whole symbol on screen.
    return {
        id,
        top: 5 + Math.random() * 85,
        left: 5 + Math.random() * 85,
        cells,
        cellSize,
        ttl: 600 + Math.random() * 500
    };
}
// Build a morse-like pattern: alternating block widths and gaps, chunky and irregular.
function buildClump(id, opts) {
    const subtle = opts?.subtle ?? false;
    const blockCount = subtle ? 2 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 5);
    const baseH = subtle ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3);
    const blocks = Array.from({
        length: blockCount
    }).map(()=>{
        const style = Math.random();
        const w = style < 0.3 ? 3 + Math.random() * 4 : style < 0.75 ? 10 + Math.random() * 18 : 24 + Math.random() * 30;
        const gap = 2 + Math.random() * 8;
        const h = baseH + (Math.random() < 0.25 ? 1 : 0);
        return {
            w,
            gap,
            h
        };
    });
    return {
        id,
        top: 10 + Math.random() * 75,
        left: -5 + Math.random() * 90,
        blocks,
        shiftX: Math.random() * 80 - 40 | 0,
        ttl: subtle ? 160 + Math.random() * 180 : 200 + Math.random() * 220
    };
}
function CrtHero() {
    const headlineRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [booted, setBooted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [powered, setPowered] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [userToggled, setUserToggled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [slices, setSlices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [ribbon, setRibbon] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [clumps, setClumps] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [tetris, setTetris] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [symbols, setSymbols] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [typed, setTyped] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [headlineScale, setHeadlineScale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const [heartbeat, setHeartbeat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [promptOpen, setPromptOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [userDraft, setUserDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [userMessage, setUserMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const promptResolverRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const t = setTimeout(()=>setBooted(true), 600);
        return ()=>clearTimeout(t);
    }, []);
    // When power goes off, clear any live debris immediately.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!powered) {
            setSlices([]);
            setRibbon(null);
            setClumps([]);
            setTetris([]);
            setSymbols([]);
            setHeartbeat(null);
            setHeadlineScale(1);
            setPromptOpen(false);
            setUserDraft("");
            setUserMessage(null);
            if (promptResolverRef.current) {
                promptResolverRef.current(null);
                promptResolverRef.current = null;
            }
        }
    }, [
        powered
    ]);
    const effectsActive = booted && powered;
    // Tetris drops — independent of the headline glitch. Each block self-schedules,
    // so drops overlap at irregular intervals instead of firing in coordinated bursts.
    // Position is UNIFORMLY random across the whole section, so bottom-left gets hit
    // as often as top-right.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!effectsActive) return;
        const timers = [];
        let nextId = 80000;
        let cancelled = false;
        const scheduleOne = (initialDelay)=>{
            const run = ()=>{
                if (cancelled) return;
                const block = buildTetris(nextId++);
                setTetris((prev)=>[
                        ...prev,
                        block
                    ]);
                const cleanup = setTimeout(()=>{
                    setTetris((prev)=>prev.filter((b)=>b.id !== block.id));
                }, block.ttl + 40);
                timers.push(cleanup);
                // This block schedules its own next drop: 1.2–4s out.
                const next = setTimeout(run, 1200 + Math.random() * 2800);
                timers.push(next);
            };
            const start = setTimeout(run, initialDelay);
            timers.push(start);
        };
        // Launch 4 independent schedulers staggered over the first few seconds.
        // Each runs forever at its own irregular cadence, so at any moment 0–3
        // blocks are on screen in different places.
        for(let i = 0; i < 4; i++){
            scheduleOne(800 + i * 700 + Math.random() * 900);
        }
        return ()=>{
            cancelled = true;
            timers.forEach(clearTimeout);
        };
    }, [
        effectsActive
    ]);
    // Symbol drops — very rare, deliberate. Heart / X / robot-face appear alone
    // somewhere on the screen every 15–30s.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!effectsActive) return;
        let timer;
        let nextId = 90000;
        let cancelled = false;
        const run = ()=>{
            if (cancelled) return;
            const sym = buildSymbol(nextId++);
            setSymbols((prev)=>[
                    ...prev,
                    sym
                ]);
            setTimeout(()=>{
                setSymbols((prev)=>prev.filter((s)=>s.id !== sym.id));
            }, sym.ttl + 80);
            timer = setTimeout(run, 4000 + Math.random() * 2000);
        };
        timer = setTimeout(run, 4000 + Math.random() * 2000);
        return ()=>{
            cancelled = true;
            clearTimeout(timer);
        };
    }, [
        effectsActive
    ]);
    const bigGlitchIdRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    const triggerBigGlitch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((intensity = "normal")=>{
        const hard = intensity === "hard";
        const count = (hard ? 4 : 2) + Math.floor(Math.random() * 3);
        const chromas = [
            "cyan",
            "magenta",
            "yellow",
            "accent"
        ];
        const nextSlices = Array.from({
            length: count
        }).map(()=>({
                id: bigGlitchIdRef.current++,
                top: Math.random() * 85,
                height: 4 + Math.random() * (hard ? 22 : 14),
                shiftX: Math.random() * (hard ? 180 : 120) - (hard ? 90 : 60) | 0,
                chroma: chromas[Math.floor(Math.random() * chromas.length)]
            }));
        setSlices(nextSlices);
        if (Math.random() < (hard ? 0.85 : 0.55)) setRibbon(Math.random() * 90);
        const clumpCount = (hard ? 2 : 1) + (Math.random() < 0.5 ? 1 : 0);
        const nextClumps = Array.from({
            length: clumpCount
        }).map(()=>buildClump(bigGlitchIdRef.current++));
        setClumps(nextClumps);
        const maxTtl = Math.max(300, ...nextClumps.map((c)=>c.ttl));
        setTimeout(()=>{
            setSlices([]);
            setRibbon(null);
        }, (hard ? 220 : 140) + Math.random() * 160);
        setTimeout(()=>setClumps([]), maxTtl + 40);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!effectsActive) return;
        let timer;
        const loop = ()=>{
            triggerBigGlitch("normal");
            timer = setTimeout(loop, 2800 + Math.random() * 4200);
        };
        timer = setTimeout(loop, 1400);
        return ()=>clearTimeout(timer);
    }, [
        effectsActive,
        triggerBigGlitch
    ]);
    // Typewriter — the found-robot boot sequence. Cancellable; pauses when power is off.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!effectsActive) return;
        let cancelled = false;
        let pendingTimer = null;
        let current = "";
        const sleep = (ms)=>new Promise((resolve)=>{
                pendingTimer = setTimeout(resolve, ms);
            });
        const runStep = async (step)=>{
            if (cancelled) return;
            if (step.kind === "type" || step.kind === "symbols") {
                if (typeof step.scale === "number") setHeadlineScale(step.scale);
                const speed = step.speed ?? 80;
                for (const char of step.text){
                    if (cancelled) return;
                    current += char;
                    setTyped(current);
                    await sleep(speed + (Math.random() * speed * 0.4 - speed * 0.2));
                }
            } else if (step.kind === "delete") {
                const speed = step.speed ?? 30;
                const leave = step.leave ?? 0;
                while(current.length > leave){
                    if (cancelled) return;
                    current = current.slice(0, -1);
                    setTyped(current);
                    await sleep(speed + Math.random() * 20);
                }
            } else if (step.kind === "hold") {
                await sleep(step.ms);
            } else if (step.kind === "glitch") {
                triggerBigGlitch(step.intensity ?? "normal");
                await sleep(step.intensity === "hard" ? 380 : 220);
            } else if (step.kind === "heartbeat") {
                const beats = step.beats ?? 3;
                const bpm = step.bpm ?? 40;
                const periodMs = Math.round(60000 / bpm);
                const id = Date.now();
                setHeartbeat({
                    id,
                    beats,
                    periodMs
                });
                // Hold through all beats + a small tail so the last beat fully fades.
                await sleep(periodMs * beats + 400);
                if (!cancelled) setHeartbeat(null);
            } else if (step.kind === "prompt") {
                setPromptOpen(true);
                const userReply = await new Promise((resolve)=>{
                    promptResolverRef.current = resolve;
                    pendingTimer = setTimeout(()=>{
                        promptResolverRef.current = null;
                        resolve(null);
                    }, step.timeoutMs);
                });
                setPromptOpen(false);
                if (cancelled) return;
                if (userReply) {
                    setUserMessage(userReply);
                    // Let the user's message sit for a moment before the robot replies.
                    await sleep(900);
                    if (cancelled) return;
                    // Robot replies: clear headline, then type the fallback line.
                    current = "";
                    setTyped("");
                    setHeadlineScale(0.7);
                    await sleep(600);
                    const reply = FALLBACK_REPLY;
                    for (const char of reply){
                        if (cancelled) return;
                        current += char;
                        setTyped(current);
                        await sleep(90 + Math.random() * 60);
                    }
                    await sleep(2800);
                    setUserMessage(null);
                }
            }
        };
        const run = async ()=>{
            while(!cancelled){
                for (const step of TYPEWRITER_SCRIPT){
                    if (cancelled) return;
                    await runStep(step);
                }
                current = "";
                setTyped("");
            }
        };
        run();
        return ()=>{
            cancelled = true;
            if (pendingTimer) clearTimeout(pendingTimer);
            setTyped("");
            setHeartbeat(null);
            setHeadlineScale(1);
        };
    }, [
        effectsActive,
        triggerBigGlitch
    ]);
    const glitching = slices.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "hero",
        className: `crt-root relative min-h-screen overflow-hidden flex items-center pl-6 md:pl-28 pr-6 md:pr-12 ${userToggled ? powered ? "is-powered" : "is-off" : ""}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "crt-dead-surface",
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/components/v2/crt-hero.tsx",
                lineNumber: 463,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>{
                    setUserToggled(true);
                    setPowered((p)=>!p);
                },
                "aria-label": powered ? "Power off CRT" : "Power on CRT",
                "aria-pressed": powered,
                className: `crt-power ${powered ? "is-on" : "is-off"}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "crt-power-ring",
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 475,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "crt-power-glyph",
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 476,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "crt-power-label font-mono",
                        children: powered ? "PWR" : "OFF"
                    }, void 0, false, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 477,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/v2/crt-hero.tsx",
                lineNumber: 465,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "crt-screen",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "crt-vignette",
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 481,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "crt-scanlines",
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 482,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "crt-flicker",
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 483,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$animated$2d$noise$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatedNoise"], {
                        opacity: 0.04
                    }, void 0, false, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 484,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "crt-stray-layer",
                        "aria-hidden": "true",
                        children: [
                            tetris.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "crt-tetris",
                                    style: {
                                        top: `${t.top}%`,
                                        left: `${t.left}%`,
                                        animationDuration: `${t.ttl}ms`
                                    },
                                    children: t.cells.map(([row, col], i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "crt-tetris-cell",
                                            style: {
                                                width: `${t.cellSize}px`,
                                                height: `${t.cellSize}px`,
                                                top: `${row * t.cellSize}px`,
                                                left: `${col * t.cellSize}px`
                                            }
                                        }, i, false, {
                                            fileName: "[project]/components/v2/crt-hero.tsx",
                                            lineNumber: 498,
                                            columnNumber: 15
                                        }, this))
                                }, t.id, false, {
                                    fileName: "[project]/components/v2/crt-hero.tsx",
                                    lineNumber: 488,
                                    columnNumber: 11
                                }, this)),
                            symbols.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "crt-symbol",
                                    style: {
                                        top: `${s.top}%`,
                                        left: `${s.left}%`,
                                        animationDuration: `${s.ttl}ms`
                                    },
                                    children: s.cells.map(([row, col], i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "crt-symbol-cell",
                                            style: {
                                                width: `${s.cellSize}px`,
                                                height: `${s.cellSize}px`,
                                                top: `${row * s.cellSize}px`,
                                                left: `${col * s.cellSize}px`
                                            }
                                        }, i, false, {
                                            fileName: "[project]/components/v2/crt-hero.tsx",
                                            lineNumber: 522,
                                            columnNumber: 15
                                        }, this))
                                }, s.id, false, {
                                    fileName: "[project]/components/v2/crt-hero.tsx",
                                    lineNumber: 512,
                                    columnNumber: 11
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 486,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute left-4 md:left-6 top-1/2 -translate-y-1/2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--v2-muted)] -rotate-90 origin-left block whitespace-nowrap",
                            children: "TRANSMISSION / V2"
                        }, void 0, false, {
                            fileName: "[project]/components/v2/crt-hero.tsx",
                            lineNumber: 538,
                            columnNumber: 9
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 537,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative flex-1 w-full",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--v2-muted)] mb-6",
                                children: booted ? "◉ SIGNAL ACQUIRED" : "◌ SCANNING…"
                            }, void 0, false, {
                                fileName: "[project]/components/v2/crt-hero.tsx",
                                lineNumber: 544,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "crt-headline-stage",
                                style: {
                                    ["--headline-scale"]: headlineScale
                                },
                                children: [
                                    heartbeat && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "crt-heartbeat",
                                        style: {
                                            ["--heartbeat-period"]: `${heartbeat.periodMs}ms`
                                        },
                                        "aria-hidden": "true",
                                        children: SYMBOL_HEART.map(([row, col], i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "crt-heartbeat-cell",
                                                style: {
                                                    top: `${row * 10}px`,
                                                    left: `${col * 10}px`
                                                }
                                            }, i, false, {
                                                fileName: "[project]/components/v2/crt-hero.tsx",
                                                lineNumber: 560,
                                                columnNumber: 17
                                            }, this))
                                    }, heartbeat.id, false, {
                                        fileName: "[project]/components/v2/crt-hero.tsx",
                                        lineNumber: 553,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        ref: headlineRef,
                                        className: `crt-headline font-[var(--font-bebas)] leading-[0.9] tracking-tight text-[clamp(2rem,7vw,6.5rem)] ${booted ? "is-visible" : "is-hidden"} ${heartbeat ? "is-muted" : ""}`,
                                        children: [
                                            typed || "\u00A0",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "crt-caret",
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/components/v2/crt-hero.tsx",
                                                lineNumber: 578,
                                                columnNumber: 13
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/v2/crt-hero.tsx",
                                        lineNumber: 571,
                                        columnNumber: 11
                                    }, this),
                                    glitching && typed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                "aria-hidden": "true",
                                                className: "crt-headline crt-chroma crt-chroma-cy font-[var(--font-bebas)] leading-[0.9] tracking-tight text-[clamp(2rem,7vw,6.5rem)]",
                                                children: typed
                                            }, void 0, false, {
                                                fileName: "[project]/components/v2/crt-hero.tsx",
                                                lineNumber: 583,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                "aria-hidden": "true",
                                                className: "crt-headline crt-chroma crt-chroma-mg font-[var(--font-bebas)] leading-[0.9] tracking-tight text-[clamp(2rem,7vw,6.5rem)]",
                                                children: typed
                                            }, void 0, false, {
                                                fileName: "[project]/components/v2/crt-hero.tsx",
                                                lineNumber: 589,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true),
                                    typed && slices.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                            "aria-hidden": "true",
                                            className: `crt-slice crt-slice-${s.chroma} font-[var(--font-bebas)] leading-[0.9] tracking-tight text-[clamp(2rem,7vw,6.5rem)]`,
                                            style: {
                                                clipPath: `polygon(0 ${s.top}%, 100% ${s.top}%, 100% ${s.top + s.height}%, 0 ${s.top + s.height}%)`,
                                                transform: `translate3d(${s.shiftX}px, 0, 0)`
                                            },
                                            children: typed
                                        }, s.id, false, {
                                            fileName: "[project]/components/v2/crt-hero.tsx",
                                            lineNumber: 599,
                                            columnNumber: 13
                                        }, this)),
                                    clumps.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            "aria-hidden": "true",
                                            className: "crt-clump",
                                            style: {
                                                top: `${c.top}%`,
                                                left: `${c.left}%`,
                                                ["--clump-shift"]: `${c.shiftX}px`,
                                                animationDuration: `${c.ttl}ms`
                                            },
                                            children: c.blocks.map((b, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "crt-clump-block",
                                                    style: {
                                                        width: `${b.w}px`,
                                                        height: `${b.h}px`,
                                                        marginRight: `${b.gap}px`
                                                    }
                                                }, i, false, {
                                                    fileName: "[project]/components/v2/crt-hero.tsx",
                                                    lineNumber: 625,
                                                    columnNumber: 17
                                                }, this))
                                        }, c.id, false, {
                                            fileName: "[project]/components/v2/crt-hero.tsx",
                                            lineNumber: 613,
                                            columnNumber: 13
                                        }, this)),
                                    ribbon !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "crt-ribbon",
                                        "aria-hidden": "true",
                                        style: {
                                            top: `${ribbon}%`
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/v2/crt-hero.tsx",
                                        lineNumber: 639,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/v2/crt-hero.tsx",
                                lineNumber: 548,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-[var(--font-bebas)] text-[color:var(--v2-muted)] text-[clamp(1rem,3vw,2rem)] mt-4 tracking-wide",
                                children: "Broadcasting on a dead channel"
                            }, void 0, false, {
                                fileName: "[project]/components/v2/crt-hero.tsx",
                                lineNumber: 647,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-12 max-w-md font-mono text-sm text-[color:var(--v2-muted)] leading-relaxed",
                                children: "A transmission from an interface that shouldn't still be awake. Tune in, or don't — the signal persists either way."
                            }, void 0, false, {
                                fileName: "[project]/components/v2/crt-hero.tsx",
                                lineNumber: 651,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-16 flex items-center gap-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "group inline-flex items-center gap-3 border border-[color:var(--v2-fg)]/30 px-6 py-3 font-mono text-xs uppercase tracking-widest text-[color:var(--v2-fg)] hover:border-[color:var(--v2-accent)] hover:text-[color:var(--v2-accent)] transition-colors duration-200",
                                        children: [
                                            "Decode Transmission",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "inline-block w-2 h-2 bg-current animate-pulse",
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/components/v2/crt-hero.tsx",
                                                lineNumber: 662,
                                                columnNumber: 13
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/v2/crt-hero.tsx",
                                        lineNumber: 657,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "/",
                                        className: "font-mono text-xs uppercase tracking-widest text-[color:var(--v2-muted)] hover:text-[color:var(--v2-fg)] transition-colors duration-200",
                                        children: "← Back to v1"
                                    }, void 0, false, {
                                        fileName: "[project]/components/v2/crt-hero.tsx",
                                        lineNumber: 664,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/v2/crt-hero.tsx",
                                lineNumber: 656,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 543,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute bottom-8 right-8 md:bottom-12 md:right-12",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border border-[color:var(--v2-fg)]/20 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--v2-muted)]",
                            children: "v.02 / CRT Broadcast"
                        }, void 0, false, {
                            fileName: "[project]/components/v2/crt-hero.tsx",
                            lineNumber: 674,
                            columnNumber: 9
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 673,
                        columnNumber: 7
                    }, this),
                    (promptOpen || userMessage) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "crt-prompt-overlay",
                        children: [
                            userMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "crt-user-line font-mono text-[color:var(--v2-accent)]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "opacity-60",
                                        children: "> "
                                    }, void 0, false, {
                                        fileName: "[project]/components/v2/crt-hero.tsx",
                                        lineNumber: 683,
                                        columnNumber: 15
                                    }, this),
                                    userMessage
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/v2/crt-hero.tsx",
                                lineNumber: 682,
                                columnNumber: 13
                            }, this),
                            promptOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                className: "crt-prompt",
                                onSubmit: (e)=>{
                                    e.preventDefault();
                                    const text = userDraft.trim();
                                    if (!text) return;
                                    const resolve = promptResolverRef.current;
                                    promptResolverRef.current = null;
                                    setUserDraft("");
                                    if (resolve) resolve(text);
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "crt-prompt-label font-mono",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "crt-prompt-dot",
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/components/v2/crt-hero.tsx",
                                                lineNumber: 701,
                                                columnNumber: 17
                                            }, this),
                                            "INCOMING CHANNEL — REPLY"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/v2/crt-hero.tsx",
                                        lineNumber: 700,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "crt-prompt-row",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "crt-prompt-caret-glyph font-mono",
                                                "aria-hidden": "true",
                                                children: ">"
                                            }, void 0, false, {
                                                fileName: "[project]/components/v2/crt-hero.tsx",
                                                lineNumber: 705,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: userDraft,
                                                onChange: (e)=>setUserDraft(e.target.value),
                                                autoFocus: true,
                                                maxLength: 200,
                                                placeholder: "type your response...",
                                                className: "crt-prompt-input font-mono",
                                                "aria-label": "Reply to the transmission"
                                            }, void 0, false, {
                                                fileName: "[project]/components/v2/crt-hero.tsx",
                                                lineNumber: 708,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "crt-prompt-caret",
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/components/v2/crt-hero.tsx",
                                                lineNumber: 718,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/v2/crt-hero.tsx",
                                        lineNumber: 704,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$0$2d$canary$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "crt-prompt-hint font-mono",
                                        children: "PRESS ENTER TO SEND"
                                    }, void 0, false, {
                                        fileName: "[project]/components/v2/crt-hero.tsx",
                                        lineNumber: 720,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/v2/crt-hero.tsx",
                                lineNumber: 688,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/v2/crt-hero.tsx",
                        lineNumber: 680,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/v2/crt-hero.tsx",
                lineNumber: 480,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/v2/crt-hero.tsx",
        lineNumber: 457,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=components_ce191f0f._.js.map