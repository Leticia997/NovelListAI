import React, { useState, useEffect } from 'react';

// 玩家角色组件
const PlayerSprite: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="20" fill="#9F7AEA" />
    <circle cx="18" cy="20" r="4" fill="white" />
    <circle cx="30" cy="20" r="4" fill="white" />
    <rect x="24" y="6" width="6" height="16" fill="#7C3AED" 
          transform="rotate(0, 24, 24)" />
  </svg>
);

// 敌人组件
const EnemySprite: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'pan':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32">
          <rect x="4" y="4" width="24" height="6" fill="#888" />
          <rect x="8" y="10" width="16" height="4" fill="#666" />
        </svg>
      );
    case 'bomb':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="#333" />
          <rect x="14" y="4" width="4" height="6" fill="#F00" />
        </svg>
      );
    default: // boss
      return (
        <svg width="40" height="40" viewBox="0 0 40 40">
          <rect x="4" y="4" width="32" height="32" fill="#EF4444" rx="4" />
        </svg>
      );
  }
};

// 水滴组件
const WaterDropSprite: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <path
      d="M8,2 C8,2 3,7 3,10 C3,13 5,14 8,14 C11,14 13,13 13,10 C13,7 8,2 8,2 Z"
      fill="rgba(152, 245, 255, 0.8)"
    />
  </svg>
);

// 主游戏组件
const AlpacaGame: React.FC = () => {
  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 340 });
  const [rotation, setRotation] = useState(0);
  const [bullets, setBullets] = useState<any[]>([]);
  const [enemies, setEnemies] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [effects, setEffects] = useState<any[]>([]);

  // 游戏常量
  const moveSpeed = 8;
  const bulletSpeed = 12;
  const shootCooldown = 150;
  const enemyTypes = ['pan', 'bomb', 'boss'];

  // 击中效果
  const addHitEffect = (x: number, y: number) => {
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

  // 键盘控制
  useEffect(() => {
    if (!gameStarted) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === ' ') {
        const centerX = position.x + 24;
        const centerY = position.y + 24;
        const angleRad = (rotation - 90) * (Math.PI / 180);
        const offsetX = Math.cos(angleRad) * 28;
        const offsetY = Math.sin(angleRad) * 28;
        
        setBullets(prev => [...prev, {
          x: centerX + offsetX,
          y: centerY + offsetY,
          dx: Math.cos(angleRad),
          dy: Math.sin(angleRad),
          id: Date.now()
        }]);
        return;
      }

      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        switch (key) {
          case 'w':
            newY = Math.max(0, prev.y - moveSpeed);
            setRotation(-90);
            break;
          case 's':
            newY = Math.min(340, prev.y + moveSpeed);
            setRotation(90);
            break;
          case 'a':
            newX = Math.max(0, prev.x - moveSpeed);
            setRotation(180);
            break;
          case 'd':
            newX = Math.min(720, prev.x + moveSpeed);
            setRotation(0);
            break;
        }

        return { x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, position, rotation]);

  // 敌人生成
  useEffect(() => {
    if (!gameStarted) return;

    const createEnemy = () => {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      setEnemies(prev => [...prev, {
        id: Date.now(),
        type,
        x: Math.random() * 700 + 50,
        y: -30,
        speed: 2 + Math.random() * 2
      }]);
    };

    const spawnInterval = setInterval(createEnemy, 2000);
    const moveInterval = setInterval(() => {
      setEnemies(prev => 
        prev
          .map(enemy => ({
            ...enemy,
            y: enemy.y + enemy.speed
          }))
          .filter(enemy => {
            if (enemy.y > 400) {
              setHealth(prev => Math.max(0, prev - 10));
              return false;
            }
            return true;
          })
      );
    }, 16);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
    };
  }, [gameStarted]);

  // 碰撞检测
  useEffect(() => {
    if (!gameStarted) return;

    const checkCollisions = () => {
      setBullets(prevBullets => {
        let newBullets = [...prevBullets];
        
        setEnemies(prevEnemies => {
          let newEnemies = [...prevEnemies];
          
          bullets.forEach(bullet => {
            enemies.forEach((enemy, index) => {
              const dx = bullet.x - enemy.x;
              const dy = bullet.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 24) {
                newBullets = newBullets.filter(b => b.id !== bullet.id);
                newEnemies[index] = null;
                addHitEffect(enemy.x, enemy.y);
                setScore(prev => prev + 100);
              }
            });
          });

          return newEnemies.filter(enemy => enemy !== null);
        });

        return newBullets;
      });

      // 检查玩家碰撞
      enemies.forEach(enemy => {
        const dx = position.x + 24 - enemy.x;
        const dy = position.y + 24 - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 32) {
          setHealth(prev => Math.max(0, prev - 20));
          setEnemies(prev => prev.filter(e => e.id !== enemy.id));
        }
      });
    };

    const gameLoop = setInterval(checkCollisions, 16);
    return () => clearInterval(gameLoop);
  }, [gameStarted, bullets, enemies, position]);

  // 游戏结束检测
  useEffect(() => {
    if (health <= 0) {
      setGameStarted(false);
    }
  }, [health]);

  // 开始游戏
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
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 text-white rounded-lg p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <h1 className="text-4xl font-bold">草泥马大作战</h1>
            <p className="text-center text-lg">
              用WASD移动，空格键发射水滴！<br/>
              击中敌人得分，小心不要让敌人碰到你！
            </p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold"
            >
              {health <= 0 ? '重新开始' : '开始游戏'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gradient-to-r from-purple-900 to-purple-800 p-4 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className="w-40 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all"
                  style={{ width: `${health}%` }}
                />
              </div>
              <span className="text-white font-bold">{health}%</span>
            </div>
            <span className="text-2xl font-bold text-yellow-300">得分: {score}</span>
          </div>

          <div className="relative bg-gradient-to-b from-purple-950 to-purple-900 w-full h-96 rounded-xl overflow-hidden">
            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className="absolute"
                style={{
                  left: `${enemy.x}px`,
                  top: `${enemy.y}px`
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
                  top: `${bullet.y}px`
                }}
              >
                <WaterDropSprite />
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
              <PlayerSprite />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <span>WASD：移动和瞄准</span>
              <span>空格：发射水滴</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlpacaGame;
