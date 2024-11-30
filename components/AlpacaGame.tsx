import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

// 敌人类型和图标
const EnemySprite = ({ type, size = 40 }) => {
  switch (type) {
    case 'pan':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M4,12 h16 v4 h-16 z" fill="#666" />
          <path d="M3,16 h18 v2 h-18 z" fill="#888" />
          <path d="M18,12 v-6 h2 v6 z" fill="#666" />
        </svg>
      );
    case 'bomb':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="14" r="8" fill="#333" />
          <path d="M11,6 h2 v4 h-2 z" fill="#666" />
          <path d="M10,4 h4 v2 h-4 z" fill="#F00" />
        </svg>
      );
    case 'pancake':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="#FFD700" />
          <ellipse cx="12" cy="11" rx="8" ry="3" fill="#FFA500" />
        </svg>
      );
    default:
      return null;
  }
};

// 水滴形状的炮弹
const SpitSprite = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <path d="M8,2 C8,2 2,8 2,11 C2,14 5,15 8,15 C11,15 14,14 14,11 C14,8 8,2 8,2 Z" 
          fill="rgba(152, 245, 255, 0.8)" />
  </svg>
);

// 草泥马组件
const PixelAlpaca = ({ color = "#9F7AEA" }) => (
  <svg width="64" height="64" viewBox="0 0 32 32">
    <path d="M8,16 h16 v8 h-16 z" fill={color} />
    <path d="M10,24 h12 v2 h-12 z" fill={color} />
    <path d="M18,10 h4 v6 h-4 z" fill={color} />
    <path d="M17,12 h2 v4 h-2 z" fill={color} />
    <path d="M20,8 h3 v2 h-3 z" fill={color} />
    <path d="M16,6 h8 v4 h-8 z" fill={color} />
    <path d="M17,4 h2 v2 h-2 z M21,4 h2 v2 h-2 z" fill={color} />
    <path d="M10,26 h4 v4 h-4 z M18,26 h4 v4 h-4 z" fill={color} />
    <path d="M18,8 h2 v2 h-2 z" fill="#FFFFFF" />
    <path d="M22,9 h1 v1 h-1 z" fill="#FF69B4" />
    <path d="M23,8 h2 v2 h-2 z" fill="#F9A8D4" />
    <path d="M19,5 h1 v1 h-1 z M20,3 h1 v1 h-1 z" fill={color} />
  </svg>
);

const TankBattle = () => {
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameStarted, setGameStarted] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 340 });
  const [rotation, setRotation] = useState(0);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [effects, setEffects] = useState([]);
  const [lastShotTime, setLastShotTime] = useState(0);

  const enemyTypes = ['pan', 'bomb', 'pancake'];
  const shootCooldown = 200;
  const moveSpeed = 5;
  const bulletSpeed = 8;

  const shoot = () => {
    const now = Date.now();
    if (now - lastShotTime < shootCooldown) return;

    let mouthOffsetX = 46;
    let mouthOffsetY = 16;

    const angleRad = rotation * (Math.PI / 180);
    const rotatedX = mouthOffsetX * Math.cos(angleRad) - mouthOffsetY * Math.sin(angleRad);
    const rotatedY = mouthOffsetX * Math.sin(angleRad) + mouthOffsetY * Math.cos(angleRad);

    const bulletX = position.x + rotatedX;
    const bulletY = position.y + rotatedY;

    const newBullet = {
      x: bulletX,
      y: bulletY,
      dx: Math.cos((rotation - 90) * (Math.PI / 180)),
      dy: Math.sin((rotation - 90) * (Math.PI / 180)),
      id: now
    };

    setBullets(prev => [...prev, newBullet]);
    setLastShotTime(now);
  };

  useEffect(() => {
    if (!gameStarted) return;

    const spawnEnemy = () => {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const x = Math.random() * 700 + 50;
      const enemy = {
        id: Date.now(),
        type,
        x,
        y: -50,
        speed: 2 + Math.random() * 2
      };
      setEnemies(prev => [...prev, enemy]);
    };

    const intervalId = setInterval(spawnEnemy, 2000);
    return () => clearInterval(intervalId);
  }, [gameStarted]);

  const addHitEffect = (x, y) => {
    const effect = {
      id: Date.now(),
      x,
      y,
      size: 1,
      opacity: 1
    };
    setEffects(prev => [...prev, effect]);
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== effect.id));
    }, 500);
  };

  useEffect(() => {
    if (!gameStarted) return;

    const checkCollisions = () => {
      bullets.forEach(bullet => {
        enemies.forEach(enemy => {
          const dx = bullet.x - enemy.x;
          const dy = bullet.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 30) {
            setBullets(prev => prev.filter(b => b.id !== bullet.id));
            setEnemies(prev => prev.filter(e => e.id !== enemy.id));
            addHitEffect(enemy.x, enemy.y);
            setScore(prev => prev + 100);
          }
        });
      });

      enemies.forEach(enemy => {
        const dx = position.x + 32 - enemy.x;
        const dy = position.y + 32 - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 40) {
          setHealth(prev => Math.max(0, prev - 10));
          setEnemies(prev => prev.filter(e => e.id !== enemy.id));
        }
      });
    };

    const intervalId = setInterval(checkCollisions, 16);
    return () => clearInterval(intervalId);
  }, [gameStarted, bullets, enemies, position]);

  useEffect(() => {
    if (!gameStarted) return;

    const moveEnemies = () => {
      setEnemies(prev => prev
        .map(enemy => ({
          ...enemy,
          y: enemy.y + enemy.speed
        }))
        .filter(enemy => enemy.y < 400)
      );
    };

    const intervalId = setInterval(moveEnemies, 16);
    return () => clearInterval(intervalId);
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted || bullets.length === 0) return;

    const intervalId = setInterval(() => {
      setBullets(prev => prev
        .map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.dx * bulletSpeed,
          y: bullet.y + bullet.dy * bulletSpeed
        }))
        .filter(bullet => 
          bullet.x >= 0 && 
          bullet.x <= 800 && 
          bullet.y >= 0 && 
          bullet.y <= 400
        )
      );
    }, 16);

    return () => clearInterval(intervalId);
  }, [gameStarted, bullets.length]);

  useEffect(() => {
    if (!gameStarted) return;

    const handleKeyPress = (e) => {
      const key = e.key.toLowerCase();
      
      if (key === ' ') {
        shoot();
        return;
      }

      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        switch (key) {
          case 'w':
            newY = Math.max(0, prev.y - moveSpeed);
            break;
          case 's':
            newY = Math.min(340, prev.y + moveSpeed);
            break;
          case 'a':
            newX = Math.max(0, prev.x - moveSpeed);
            break;
          case 'd':
            newX = Math.min(720, prev.x + moveSpeed);
            break;
          default:
            break;
        }

        return { x: newX, y: newY };
      });
      
      setRotation(prev => {
        switch (key) {
          case 'w': return -90;
          case 's': return 90;
          case 'a': return 180;
          case 'd': return 0;
          default: return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted]);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setHealth(100);
    setPosition({ x: 20, y: 340 });
    setBullets([]);
    setEnemies([]);
    setEffects([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {!gameStarted ? (
        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 text-white">
          <CardContent className="flex flex-col items-center justify-center space-y-6 p-12">
            <h1 className="text-4xl font-bold">草泥马大作战</h1>
            <p className="text-center text-lg">
              躲避平底锅、炸弹和圆饼的攻击！<br/>
              用唾液击退敌人，获得高分！
            </p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold"
            >
              开始游戏
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gradient-to-r from-purple-900 to-purple-800 p-6 rounded-xl">
            <div className="flex items-center space-x-6">
              <div className="scale-75"><PixelAlpaca /></div>
              <div className="w-40 h-5 bg-purple-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all"
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-300">
              得分: {score}
            </div>
          </div>

          <div className="relative bg-gradient-to-b from-purple-950 to-purple-900 w-full h-96 rounded-xl overflow-hidden">
            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className="absolute transition-transform"
                style={{
                  left: `${enemy.x}px`,
                  top: `${enemy.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <EnemySprite type={enemy.type} />
              </div>
            ))}

            {bullets.map(bullet => (
              <div
                key={bullet.id}
                className="absolute"
                style={{
                  left: `${bullet.x}px`,
                  top: `${bullet.y}px`,
                  transform: `rotate(${Math.atan2(bullet.dy, bullet.dx) * 180 / Math.PI + 90}deg)`
                }}
              >
                <SpitSprite />
              </div>
            ))}

            {effects.map(effect => (
              <div
                key={effect.id}
                className="absolute rounded-full bg-blue-400"
                style={{
                  left: `${effect.x}px`,
                  top: `${effect.y}px`,
                  width: `${effect.size * 20}px`,
                  height: `${effect.size * 20}px`,
                  opacity: effect.opacity,
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.5s ease-out'
                }}
              />
            ))}

            <div 
              className="absolute transition-all duration-100"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: `rotate(${rotation}deg)`
              }}
            >
              <PixelAlpaca />
            </div>
          </div>

          <Card className="bg-gradient-to-r from-purple-900 to-purple-800 text-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span>WASD：移动和瞄准</span>
                <span>空格：发射唾液</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TankBattle;
