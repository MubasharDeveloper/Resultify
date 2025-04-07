import React from 'react'

export default function NoDataTable(prop) {
  return (
    <div className="text-center py-4">
        <img
            src={prop.img} // or use an imported image
            alt="No Data"
            style={{ width: '280px', marginBottom: '20px', marginTop: '50px', opacity: 0.7 }}
        />
        <div style={{ fontSize: '1rem', color: '#6c757d' }}>
            {prop.text}
        </div>
    </div>
  )
}
