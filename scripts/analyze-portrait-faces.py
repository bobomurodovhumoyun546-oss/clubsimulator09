"""Analyze existing portraits; never modifies an image. Requires opencv-python-headless."""
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import os
os.environ['OPENCV_LOG_LEVEL']='SILENT'
import cv2
import numpy as np
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'src/data/portraitAssets.json').read_text())
urls=set(manifest.values())
def collect(value):
    if isinstance(value,dict):
        if isinstance(value.get('image'),str) and value['image'].startswith('/'):urls.add(value['image'])
        for item in value.values():collect(item)
    elif isinstance(value,list):
        for item in value:collect(item)
for filename in ['rivalsEvent.json','rivalsLegacy.json','ballonPortraits.json','starterPlayers.json']:
    collect(json.loads((root/'src/data'/filename).read_text(encoding='utf-8-sig')))
for path in (root/'public/player-headshots').rglob('*'):
    if path.suffix.lower() in ['.png','.jpg','.jpeg','.webp']:urls.add('/'+path.relative_to(root/'public').as_posix())
cv2.setNumThreads(1)
def analyze(url):
    path=root/'public'/url.lstrip('/')
    if not path.exists(): return None
    img=cv2.imread(str(path))
    if img is None: return None
    height,width=img.shape[:2]
    detector=cv2.FaceDetectorYN.create(str(root/'scripts/resources/face_detection_yunet_2023mar.onnx'),'',(width,height),.8,.3,1000)
    _,faces=detector.detect(img)
    if faces is None or len(faces)==0: return None
    face=max(faces,key=lambda b:b[2]*b[3]-.08*((b[0]+b[2]/2-width/2)**2+(b[1]+b[3]/2-height*.35)**2))
    x,y,w,h=[int(v) for v in face[:4]]
    x=max(0,x);y=max(0,y);w=min(w,width-x);h=min(h,height-y)
    if w<10 or h<10:return None
    x1=max(0,int(x-w*.22));y1=max(0,int(y-h*.35));x2=min(width,int(x+w*1.22));y2=min(height,int(y+h*1.13))
    cheek=img[int(y+h*.5):int(y+h*.77),int(x+w*.2):int(x+w*.8)]
    color=np.median(cheek.reshape(-1,3),axis=0).astype(int)
    skin='#'+''.join(f'{v:02x}' for v in color[::-1])
    return url,{'repeat':[(x2-x1)/width,(y2-y1)/height],'offset':[x1/width,1-y2/height],'skin':skin,'detected':True}
output=root/'src/data/portraitFaces.json'
result=json.loads(output.read_text()) if output.exists() else {}
urls=urls-set(result.keys())
with ThreadPoolExecutor(max_workers=8) as pool:
    for index,value in enumerate(pool.map(analyze,sorted(urls))):
        if value:result[value[0]]=value[1]
        if (index+1)%300==0:print('Analyzed',index+1,'detected',len(result),flush=True)
output.write_text(json.dumps(result,separators=(',',':')))
print('Face profiles total',len(result),'new images checked',len(urls),flush=True)
