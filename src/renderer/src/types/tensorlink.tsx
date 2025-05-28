export interface TensorlinkStats {
  validators: number
  workers: number
  users: number
  proposal: number
  available_capacity: number
  used_capacity: number
  models: string[]
}

export interface TensorlinkStatus {
  connected: boolean
  stats?: TensorlinkStats
}
