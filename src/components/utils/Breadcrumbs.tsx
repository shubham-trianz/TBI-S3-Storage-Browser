import { MdChevronRight } from 'react-icons/md';

type Props = {
  pathStack: string[];
  onNavigate: (x: string[]) => void
  onExitCase: () => void;
}

export default function Breadcrumbs({onNavigate, onExitCase, pathStack}: Props) {
  
  return (
    
    <div className="breadcrumb">
      <span 
        className="breadcrumb-link"
        onClick={onExitCase}
      >
        Home
      </span>
      {
        pathStack.map((segment, index) => {
          const name = segment.replace('/', '')
          const isLast = index === pathStack.length - 1

          return (
            <span key={index} className='breadcrumb-item'>
              <MdChevronRight className='breadcrumb-separator'/>
              <span
                className={isLast? '': 'breadcrumb-link'}
                onClick={isLast? undefined: () => onNavigate(pathStack.slice(0, index+1))}
              >
                {name}
              </span>
            </span>
          )
        })
      }
    </div>
  );
}