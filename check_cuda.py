import torch
print(torch.__version__)


def check_cuda_pytorch():
    # Check if CUDA is available in PyTorch
    if torch.cuda.is_available():
        print("CUDA is available for PyTorch.")
        print(f"CUDA Device: {torch.cuda.get_device_name(torch.cuda.current_device())}")
        print(f"CUDA Memory Allocated: {torch.cuda.memory_allocated() / 1024 ** 3:.2f} GB")
        print(f"CUDA Memory Cached: {torch.cuda.memory_cached() / 1024 ** 3:.2f} GB")
    else:
        print("CUDA is not available for PyTorch.")

def main():
    print("Checking CUDA availability...")
    check_cuda_pytorch()

if __name__ == "__main__":
    main()
